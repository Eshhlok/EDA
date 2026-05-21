from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.intelligence.intent_parser import detect_intent
from services.intelligence.analytics_router import run_analysis
from services.intelligence.response_builder import build_response

router = APIRouter(tags=["copilot"])


class CopilotQuery(BaseModel):
    dataset_id: str
    message: str


@router.post("/copilot/query")
async def copilot_query(payload: CopilotQuery):

    intent = detect_intent(payload.message)

    results = run_analysis(
        intent=intent,
        dataset_id=payload.dataset_id,
    )

    if "error" in results:
        raise HTTPException(
            status_code=404,
            detail=results["error"]
        )

    response = build_response(
        intent=intent,
        results=results,
    )

    return {
        "intent": intent,
        **response,
    }