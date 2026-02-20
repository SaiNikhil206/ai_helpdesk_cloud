from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.init_db import get_db
from app.services.metrics import metrics_summary

router = APIRouter(
    prefix="/api/metrics",
    tags=["metrics"]
)


@router.get("/summary")
def get_metrics(db: Session = Depends(get_db)):
    return metrics_summary(db)
