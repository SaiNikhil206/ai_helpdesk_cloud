from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.init_db import get_db
from app.services.metrics import metrics_summary, metrics_trends

router = APIRouter(
    prefix="/api/metrics",
    tags=["metrics"]
)


@router.get("/summary")
def get_metrics_summary(db: Session = Depends(get_db)):
    return metrics_summary(db)


@router.get("/trends")
def get_metrics_trends(days: int = 7, db: Session = Depends(get_db)):
    return metrics_trends(db, days)