from typing import Dict, Any, List, Tuple
from models.explanation import FactorDetail, ExplainResponse

class ExplanationEngine:
    """
    Transparent feature attribution and natural language explanation engine.
    Calculates positive/negative factors driving the credit risk score independently of policy thresholds.
    """

    BENCHMARKS = {
        "rent_payment_ratio": {"benchmark": 0.85, "weight": 2.2, "name": "Rent payment ratio"},
        "utility_payment_ratio": {"benchmark": 0.85, "weight": 2.0, "name": "Utility payment ratio"},
        "telecom_payment_ratio": {"benchmark": 0.85, "weight": 1.8, "name": "Telecom payment ratio"},
        "payment_consistency": {"benchmark": 0.85, "weight": 2.8, "name": "Overall payment consistency"},
        "income_to_expense_ratio": {"benchmark": 1.40, "weight": 2.0, "name": "Income-to-expense cashflow ratio"},
        "avg_bank_balance": {"benchmark": 10000.0, "weight": 1.2, "name": "Average monthly bank balance"},
        "bounce_count_6m": {"benchmark": 1.0, "weight": -2.5, "name": "6-month return/bounce count", "inverted": True},
        "gig_earnings_stability": {"benchmark": 0.70, "weight": 1.8, "name": "Gig earnings stability index"},
        "gig_rating": {"benchmark": 4.30, "weight": 1.5, "name": "Gig platform customer rating"},
        "data_conflict_count": {"benchmark": 0.0, "weight": -2.0, "name": "Alternate data discrepancy count", "inverted": True},
        "fraud_risk_score": {"benchmark": 0.15, "weight": -3.0, "name": "Intake fraud/anomaly score", "inverted": True},
    }

    def explain(self, feature_vector: Dict[str, Any], risk_score: float, decision: str = "REVIEW") -> ExplainResponse:
        positive_factors = []
        negative_factors = []
        factor_details = []

        # 1. Rent payment ratio
        rent = feature_vector.get("rent_payment_ratio")
        if rent is not None:
            if rent >= 0.90:
                msg = f"Consistent rental payment history with on-time ratio of {rent:.1%}"
                positive_factors.append(msg)
                factor_details.append(FactorDetail(feature="rent_payment_ratio", impact="POSITIVE", weight=0.85, description=msg))
            elif rent < 0.75:
                msg = f"Sub-optimal rental payment track record ({rent:.1%} on-time ratio)"
                negative_factors.append(msg)
                factor_details.append(FactorDetail(feature="rent_payment_ratio", impact="NEGATIVE", weight=-0.80, description=msg))

        # 2. Utility & Telecom payment ratio
        util = feature_vector.get("utility_payment_ratio")
        tele = feature_vector.get("telecom_payment_ratio")
        if util is not None and util >= 0.90 and tele is not None and tele >= 0.90:
            msg = f"High utility ({util:.1%}) and telecom ({tele:.1%}) payment discipline"
            positive_factors.append(msg)
            factor_details.append(FactorDetail(feature="utility_telecom_payments", impact="POSITIVE", weight=0.75, description=msg))
        elif (util is not None and util < 0.75) or (tele is not None and tele < 0.75):
            msg = "Irregular utility or telecom bill payment history detected"
            negative_factors.append(msg)
            factor_details.append(FactorDetail(feature="utility_telecom_payments", impact="NEGATIVE", weight=-0.65, description=msg))

        # 3. Payment consistency
        consistency = feature_vector.get("payment_consistency")
        if consistency is not None:
            if consistency >= 0.88:
                msg = f"Strong multi-source payment consistency index ({consistency:.2f})"
                positive_factors.append(msg)
                factor_details.append(FactorDetail(feature="payment_consistency", impact="POSITIVE", weight=0.90, description=msg))
            elif consistency < 0.78:
                msg = f"Elevated payment volatility across historical billing cycles ({consistency:.2f})"
                negative_factors.append(msg)
                factor_details.append(FactorDetail(feature="payment_consistency", impact="NEGATIVE", weight=-0.85, description=msg))

        # 4. Bank bounces
        bounces = feature_vector.get("bounce_count_6m")
        if bounces is not None:
            if bounces == 0:
                msg = "Zero account or cheque bounces recorded in the preceding 6 months"
                positive_factors.append(msg)
                factor_details.append(FactorDetail(feature="bounce_count_6m", impact="POSITIVE", weight=0.90, description=msg))
            elif bounces >= 2:
                msg = f"Elevated banking return activity ({bounces} bounces in past 6 months)"
                negative_factors.append(msg)
                factor_details.append(FactorDetail(feature="bounce_count_6m", impact="NEGATIVE", weight=-0.95, description=msg))

        # 5. Income-to-expense and cashflow buffer
        ie_ratio = feature_vector.get("income_to_expense_ratio")
        if ie_ratio is not None:
            if ie_ratio >= 1.50:
                msg = f"Healthy monthly cashflow buffer (income-to-expense ratio of {ie_ratio:.2f}x)"
                positive_factors.append(msg)
                factor_details.append(FactorDetail(feature="income_to_expense_ratio", impact="POSITIVE", weight=0.70, description=msg))
            elif ie_ratio < 1.15:
                msg = f"Tight disposable cashflow margin (income-to-expense ratio of {ie_ratio:.2f}x)"
                negative_factors.append(msg)
                factor_details.append(FactorDetail(feature="income_to_expense_ratio", impact="NEGATIVE", weight=-0.75, description=msg))

        # 6. Gig platform alternate data (if gig worker)
        emp_type = feature_vector.get("employment_type", "")
        if emp_type == "gig":
            gig_stability = feature_vector.get("gig_earnings_stability")
            gig_rating = feature_vector.get("gig_rating")
            if gig_stability is not None and gig_stability >= 0.75:
                msg = f"Demonstrated gig earnings stability ({gig_stability:.2f}) across billing cycles"
                positive_factors.append(msg)
                factor_details.append(FactorDetail(feature="gig_earnings_stability", impact="POSITIVE", weight=0.60, description=msg))
            if gig_rating is not None and gig_rating >= 4.5:
                msg = f"Top-tier gig platform reputation and customer satisfaction rating ({gig_rating:.2f}/5.0)"
                positive_factors.append(msg)
                factor_details.append(FactorDetail(feature="gig_rating", impact="POSITIVE", weight=0.50, description=msg))

        # 7. Discrepancies and fraud indicators
        conflicts = feature_vector.get("data_conflict_count", 0)
        fraud = feature_vector.get("fraud_risk_score", 0.0)
        if conflicts is not None and conflicts > 0:
            msg = f"Cross-verification discrepancies flagged ({conflicts} data conflicts detected)"
            negative_factors.append(msg)
            factor_details.append(FactorDetail(feature="data_conflict_count", impact="NEGATIVE", weight=-0.70, description=msg))
        if fraud is not None and fraud > 0.25:
            msg = f"Elevated intake anomaly and fraud risk indicator ({fraud:.2f})"
            negative_factors.append(msg)
            factor_details.append(FactorDetail(feature="fraud_risk_score", impact="NEGATIVE", weight=-0.90, description=msg))

        # Generate summary text based on risk_score and dominant drivers
        if risk_score <= 35.0:
            summary = (
                f"Credit risk score is low ({risk_score:.1f}/100). "
                f"Primary creditworthiness drivers include: {'; '.join(positive_factors[:2]) if positive_factors else 'strong alternate payment profiles'}."
            )
        elif risk_score <= 60.0:
            summary = (
                f"Credit risk score is moderate ({risk_score:.1f}/100). "
                f"Balanced profile showing alternate strengths alongside points for underwriter review: {'; '.join(negative_factors[:2]) if negative_factors else 'moderate financial buffer'}."
            )
        else:
            summary = (
                f"Credit risk score is elevated ({risk_score:.1f}/100). "
                f"Adverse risk primarily driven by: {'; '.join(negative_factors[:2]) if negative_factors else 'insufficient liquidity buffers'}."
            )

        return ExplainResponse(
            positive_factors=positive_factors,
            negative_factors=negative_factors,
            factor_details=factor_details,
            summary_text=summary
        )

explanation_engine = ExplanationEngine()
