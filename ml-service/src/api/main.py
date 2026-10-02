from fastapi import FastAPI
from pydantic import BaseModel

from src.prediction.predictor import CropPredictor


app = FastAPI(title="KrishiSphere ML Service")

predictor = CropPredictor()


class CropInput(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(data: CropInput):
    return predictor.predict(data.model_dump())