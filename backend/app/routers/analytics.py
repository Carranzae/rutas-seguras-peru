"""
Ruta Segura Perú - Analytics Router
Real-time analytics and metrics API
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User, UserRole
from app.models.tour import Tour, TourStatus
from app.models.payment import Payment, PaymentStatus, Booking
from app.models.emergency import Emergency, EmergencyStatus
from app.core.cache import app_cache, CachePriority, cached
from app.core.audit import audit_log, AuditAction


router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/realtime")
async def get_realtime_metrics(
    db: AsyncSession = Depends(get_db),
):
    """
    Get real-time system metrics.
    
    Updates every 10 seconds, cached for efficient access.
    """
    cache_key = "analytics:realtime"
    cached_data = app_cache.get(cache_key)
    
    if cached_data:
        return cached_data
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Active users (logged in last 15 min)
    active_threshold = now - timedelta(minutes=15)
    
    # Today's metrics
    today_bookings = await db.execute(
        select(func.count(Booking.id)).where(Booking.created_at >= today_start)
    )
    today_revenue = await db.execute(
        select(func.sum(Payment.amount)).where(
            and_(
                Payment.created_at >= today_start,
                Payment.status == PaymentStatus.COMPLETED,
            )
        )
    )
    active_tours = await db.execute(
        select(func.count(Tour.id)).where(Tour.status == TourStatus.IN_PROGRESS)
    )
    active_emergencies = await db.execute(
        select(func.count(Emergency.id)).where(
            Emergency.status.in_([EmergencyStatus.ACTIVE, EmergencyStatus.RESPONDING])
        )
    )
    
    metrics = {
        "timestamp": now.isoformat(),
        "today": {
            "bookings": today_bookings.scalar() or 0,
            "revenue": float(today_revenue.scalar() or 0),
            "new_users": 0,  # Would need login tracking
        },
        "live": {
            "active_tours": active_tours.scalar() or 0,
            "active_emergencies": active_emergencies.scalar() or 0,
            "websocket_connections": 0,  # From WebSocket manager
        },
    }
    
    # Cache for 10 seconds
    app_cache.set(cache_key, metrics, ttl=10, priority=CachePriority.HIGH)
    
    return metrics


@router.get("/revenue")
async def get_revenue_analytics(
    period: str = Query("week", pattern="^(day|week|month|quarter|year)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get revenue analytics for specified period.
    
    Includes:
    - Total revenue
    - Platform fees
    - Agency payouts
    - Guide payouts
    - Daily breakdown
    """
    now = datetime.now(timezone.utc)
    
    period_days = {
        "day": 1,
        "week": 7,
        "month": 30,
        "quarter": 90,
        "year": 365,
    }
    
    start_date = now - timedelta(days=period_days[period])
    
    # Aggregate revenue
    revenue_query = await db.execute(
        select(
            func.sum(Payment.amount).label("total"),
            func.sum(Payment.platform_fee).label("platform_fees"),
            func.sum(Payment.agency_amount).label("agency_payouts"),
            func.sum(Payment.guide_amount).label("guide_payouts"),
            func.count(Payment.id).label("transaction_count"),
        ).where(
            and_(
                Payment.created_at >= start_date,
                Payment.status == PaymentStatus.COMPLETED,
            )
        )
    )
    
    row = revenue_query.fetchone()
    
    # Daily breakdown (last 7 days regardless of period)
    daily_query = await db.execute(
        select(
            func.date_trunc("day", Payment.created_at).label("day"),
            func.sum(Payment.amount).label("revenue"),
            func.count(Payment.id).label("transactions"),
        ).where(
            and_(
                Payment.created_at >= now - timedelta(days=7),
                Payment.status == PaymentStatus.COMPLETED,
            )
        ).group_by(func.date_trunc("day", Payment.created_at))
        .order_by(func.date_trunc("day", Payment.created_at))
    )
    
    daily_data = [
        {"date": str(r.day.date()), "revenue": float(r.revenue or 0), "transactions": r.transactions}
        for r in daily_query.fetchall()
    ]
    
    return {
        "period": period,
        "start_date": start_date.isoformat(),
        "end_date": now.isoformat(),
        "totals": {
            "revenue": float(row.total or 0),
            "platform_fees": float(row.platform_fees or 0),
            "agency_payouts": float(row.agency_payouts or 0),
            "guide_payouts": float(row.guide_payouts or 0),
            "transaction_count": row.transaction_count or 0,
        },
        "commission_rate": 0.15,
        "daily_breakdown": daily_data,
    }


@router.get("/tours")
async def get_tour_analytics(
    period: str = Query("month", pattern="^(week|month|quarter|year)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get tour analytics.
    
    Includes:
    - Tours by status
    - Completion rate
    - Average participants
    - Popular categories
    """
    now = datetime.now(timezone.utc)
    period_days = {"week": 7, "month": 30, "quarter": 90, "year": 365}
    start_date = now - timedelta(days=period_days[period])
    
    # Status counts
    status_query = await db.execute(
        select(Tour.status, func.count(Tour.id))
        .group_by(Tour.status)
    )
    status_counts = {str(r[0].value): r[1] for r in status_query.fetchall()}
    
    # Bookings per tour (average)
    avg_participants = await db.execute(
        select(func.avg(Booking.participants)).where(
            Booking.created_at >= start_date
        )
    )
    
    # Category distribution
    category_query = await db.execute(
        select(Tour.category, func.count(Tour.id))
        .group_by(Tour.category)
    )
    categories = {r[0]: r[1] for r in category_query.fetchall() if r[0]}
    
    total_tours = sum(status_counts.values())
    completed = status_counts.get("completed", 0)
    
    return {
        "period": period,
        "total_tours": total_tours,
        "by_status": status_counts,
        "completion_rate": f"{(completed / total_tours * 100):.1f}%" if total_tours else "0%",
        "avg_participants": round(avg_participants.scalar() or 0, 1),
        "by_category": categories,
    }


@router.get("/emergencies")
async def get_emergency_analytics(
    period: str = Query("month", pattern="^(week|month|quarter|year)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get emergency analytics.
    
    Includes:
    - Total emergencies
    - By severity
    - Response times
    - Resolution rate
    """
    now = datetime.now(timezone.utc)
    period_days = {"week": 7, "month": 30, "quarter": 90, "year": 365}
    start_date = now - timedelta(days=period_days[period])
    
    # Count by severity
    severity_query = await db.execute(
        select(Emergency.severity, func.count(Emergency.id))
        .where(Emergency.created_at >= start_date)
        .group_by(Emergency.severity)
    )
    by_severity = {str(r[0].value): r[1] for r in severity_query.fetchall()}
    
    # Count by status
    status_query = await db.execute(
        select(Emergency.status, func.count(Emergency.id))
        .where(Emergency.created_at >= start_date)
        .group_by(Emergency.status)
    )
    by_status = {str(r[0].value): r[1] for r in status_query.fetchall()}
    
    total = sum(by_status.values())
    resolved = by_status.get("resolved", 0)
    
    return {
        "period": period,
        "total": total,
        "by_severity": by_severity,
        "by_status": by_status,
        "resolution_rate": f"{(resolved / total * 100):.1f}%" if total else "0%",
        "active_now": by_status.get("active", 0) + by_status.get("responding", 0),
    }


@router.get("/performance")
async def get_performance_metrics():
    """
    Get system performance metrics.
    
    Includes:
    - Cache hit rate
    - Circuit breaker status
    - Response time percentiles
    """
    from app.core.cache import app_cache
    from app.core.resilience import claude_circuit, vonage_circuit, izipay_circuit
    
    circuits = {
        "claude": {
            "state": claude_circuit.state.value,
            "failures": claude_circuit.stats.consecutive_failures,
        },
        "vonage": {
            "state": vonage_circuit.state.value,
            "failures": vonage_circuit.stats.consecutive_failures,
        },
        "izipay": {
            "state": izipay_circuit.state.value,
            "failures": izipay_circuit.stats.consecutive_failures,
        },
    }
    
    return {
        "cache": app_cache.stats,
        "circuit_breakers": circuits,
        "uptime_seconds": 0,  # Would come from startup time tracking
    }


@router.get("/health")
async def get_health_status():
    """
    Get complete system health status.
    """
    from app.core.health import health_monitor
    
    return await health_monitor.full_health_check()


@router.get("/health/live")
async def liveness_check():
    """
    Quick liveness check for load balancers.
    """
    from app.core.health import health_monitor
    
    return health_monitor.quick_check()


@router.get("/audit")
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
):
    """
    Get recent audit logs.
    """
    events = audit_log.get_recent_events(limit=limit, action_filter=action)
    
    return {
        "events": [e.to_dict() for e in events],
        "total": len(events),
        "stats": audit_log.get_stats(),
    }


@router.get("/predictions")
async def get_danger_predictions():
    """
    Get current danger predictions for all tracked users.
    """
    from app.services.safety_monitor import safety_monitor
    
    # Get all user statuses with predictions
    statuses = safety_monitor.get_all_user_statuses()
    
    # Filter high risk users
    high_risk = [s for s in statuses if (s.get("risk_score") or 0) > 50]
    
    return {
        "total_tracked": len(statuses),
        "high_risk_count": len(high_risk),
        "high_risk_users": high_risk[:10],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
