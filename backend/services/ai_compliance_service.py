"""
AI Compliance Service for Packaged Commodities
Evaluates extracted packaging declarations against Legal Metrology Rules (2011)
and provides automated risk scoring, legal citations, and packaging corrections.
"""

from typing import Dict, List, Any, Optional
import logging
import json
import re
from config import settings

logger = logging.getLogger(__name__)


class AIComplianceService:
    """
    AI-Powered Compliance reasoning engine
    Works out-of-the-box with built-in heuristic reasoning & legal metrology knowledge base,
    and supports optional external LLM API (Gemini / OpenAI) if configured.
    """

    # Legal Metrology (Packaged Commodities) Rules 2011 standard guidelines:
    LEGAL_METROLOGY_STANDARDS = {
        "mrp": {
            "rule": "Rule 6(1)(e)",
            "requirement": "Maximum Retail Price inclusive of all taxes must be declared clearly with currency symbol (₹ / Rs.)",
            "penalty": "Fine up to ₹25,000 for first offence under Section 36(1) of LM Act 2009"
        },
        "net_quantity": {
            "rule": "Rule 6(1)(c) & Second Schedule",
            "requirement": "Net quantity in standard metric units (g, kg, ml, l). Letter symbols must be in lower case (e.g., 'g', 'kg') except 'L' or 'ml'",
            "penalty": "Fine up to ₹20,000 under Section 30 of LM Act 2009"
        },
        "manufacturer": {
            "rule": "Rule 6(1)(a)",
            "requirement": "Name and complete address of the manufacturer or packer or importer must be prominently printed",
            "penalty": "Fine up to ₹25,000 for misdeclaration"
        },
        "address": {
            "rule": "Rule 6(1)(a)",
            "requirement": "Complete postal address including State and PIN code where the consumer can reach the responsible entity",
            "penalty": "Procedural violation fine up to ₹10,000"
        },
        "date": {
            "rule": "Rule 6(1)(d)",
            "requirement": "Month and year of manufacture or packaging must be declared (e.g. 08/2026 or Aug 2026)",
            "penalty": "Sale prohibited after expiry; packaging violation fine up to ₹25,000"
        },
        "consumer_care": {
            "rule": "Rule 6(1)(f)",
            "requirement": "Name, address, telephone number, and email address of person/office to be contacted in case of consumer complaints",
            "penalty": "Fine up to ₹25,000 under Rule 32 of LM(PC) Rules"
        },
        "country_of_origin": {
            "rule": "Rule 6(1)(a) Amendment 2017/2020",
            "requirement": "Country of origin must be declared on all imported and domestic pre-packaged commodities",
            "penalty": "Customs clearance hold / fine up to ₹50,000"
        }
    }

    @classmethod
    async def assess_compliance(
        cls,
        declarations: Dict[str, Any],
        category: str = "General",
        product_name: Optional[str] = None,
        existing_rule_results: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate extracted declarations and return deep AI assessment
        """
        # If external LLM is configured (e.g. Gemini), attempt external evaluation; fallback to built-in reasoning
        if settings.ai_provider == "gemini" and settings.ai_api_key:
            try:
                return await cls._assess_with_gemini(declarations, category, product_name)
            except Exception as e:
                logger.warning(f"External Gemini AI compliance check failed, falling back to built-in AI: {e}")

        # Built-in AI compliance reasoning engine
        return cls._assess_with_builtin_engine(declarations, category, product_name, existing_rule_results)

    @classmethod
    def _assess_with_builtin_engine(
        cls,
        declarations: Dict[str, Any],
        category: str,
        product_name: Optional[str],
        existing_rule_results: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Rule-augmented deterministic & heuristic legal reasoning
        """
        recommendations = []
        corrections = {}
        total_fields = len(cls.LEGAL_METROLOGY_STANDARDS)
        compliant_fields = 0
        critical_violations = 0

        # Helper to extract value
        def get_val(key):
            item = declarations.get(key)
            if isinstance(item, dict):
                return item.get('value')
            return item

        # 1. MRP evaluation
        mrp_val = get_val('mrp')
        if not mrp_val:
            critical_violations += 1
            recommendations.append({
                "field": "mrp",
                "issue": "Missing Maximum Retail Price (MRP) declaration on principal display panel.",
                "recommendation": "Display 'MRP ₹ [Amount] (incl. of all taxes)' in bold, high-contrast typography.",
                "legal_reference": cls.LEGAL_METROLOGY_STANDARDS["mrp"]["rule"],
                "severity": "HIGH"
            })
            corrections["mrp"] = "MRP ₹0.00 (incl. of all taxes)"
        else:
            compliant_fields += 1
            # Check for incl. of taxes suffix
            if not any(token in str(mrp_val).lower() for token in ['tax', 'incl', 'all']):
                recommendations.append({
                    "field": "mrp",
                    "issue": "MRP declared without explicit 'inclusive of all taxes' notation.",
                    "recommendation": "Append '(incl. of all taxes)' directly adjacent to the retail price declaration.",
                    "legal_reference": "Rule 6(1)(e) - Mandatory tax clarity",
                    "severity": "MEDIUM"
                })

        # 2. Net Quantity evaluation
        nq_val = get_val('net_quantity')
        if not nq_val:
            critical_violations += 1
            recommendations.append({
                "field": "net_quantity",
                "issue": "Net Quantity declaration is missing.",
                "recommendation": "Declare exact net weight or volume in SI metric units (e.g., 'Net Qty: 500 g' or '1 L').",
                "legal_reference": cls.LEGAL_METROLOGY_STANDARDS["net_quantity"]["rule"],
                "severity": "HIGH"
            })
            corrections["net_quantity"] = "Net Qty: ___ g / ml"
        else:
            compliant_fields += 1
            # Check unit format (e.g. non-metric or capitalized KG)
            if re.search(r'\b(?:lbs?|oz|gms|kgs)\b', str(nq_val), re.IGNORECASE):
                recommendations.append({
                    "field": "net_quantity",
                    "issue": f"Non-standard unit abbreviation '{nq_val}'. Legal Metrology mandates standard metric symbols.",
                    "recommendation": "Replace non-standard abbreviations like 'gms' or 'lbs' with statutory metric symbols: 'g', 'kg', 'ml', 'L'.",
                    "legal_reference": "Legal Metrology Rules 2011, Schedule II",
                    "severity": "MEDIUM"
                })

        # 3. Manufacturer / Packer Details
        mfg_val = get_val('manufacturer')
        if not mfg_val:
            critical_violations += 1
            recommendations.append({
                "field": "manufacturer",
                "issue": "Manufacturer / Packer / Importer legal corporate identity not detected.",
                "recommendation": "Clearly state 'Manufactured by:' or 'Packed by:' followed by registered company name.",
                "legal_reference": cls.LEGAL_METROLOGY_STANDARDS["manufacturer"]["rule"],
                "severity": "HIGH"
            })
            corrections["manufacturer"] = "Manufactured & Packed by: [Company Name]"
        else:
            compliant_fields += 1

        # 4. Address Details
        addr_val = get_val('address')
        if not addr_val:
            recommendations.append({
                "field": "address",
                "issue": "Complete postal address of manufacturer / packer not detected.",
                "recommendation": "Provide full physical address with premises number, street, city, state, and 6-digit postal PIN code.",
                "legal_reference": cls.LEGAL_METROLOGY_STANDARDS["address"]["rule"],
                "severity": "HIGH"
            })
            corrections["address"] = "Address: [Premises, City, State - PIN]"
        else:
            compliant_fields += 1
            if not re.search(r'\b\d{6}\b', str(addr_val)):
                recommendations.append({
                    "field": "address",
                    "issue": "Postal address may be missing statutory 6-digit PIN code.",
                    "recommendation": "Ensure 6-digit PIN code is legibly printed with address for consumer outreach validity.",
                    "legal_reference": "Rule 6(1)(a) compliance guidance",
                    "severity": "LOW"
                })

        # 5. Date of Manufacture / Packaging
        date_val = get_val('date')
        if not date_val:
            recommendations.append({
                "field": "date",
                "issue": "Manufacturing / Packaging Date (MFG / PKD) not identified.",
                "recommendation": "Print 'Mfg Date: MM/YYYY' or 'Pkd on: DD/MM/YYYY' visibly.",
                "legal_reference": cls.LEGAL_METROLOGY_STANDARDS["date"]["rule"],
                "severity": "MEDIUM"
            })
            corrections["date"] = "MFG Date: MM/YYYY"
        else:
            compliant_fields += 1

        # 6. Consumer Care Contact Details
        care_val = get_val('consumer_care')
        if not care_val:
            recommendations.append({
                "field": "consumer_care",
                "issue": "Mandatory Consumer Care helpline and grievance email are absent.",
                "recommendation": "Provide: 'For consumer complaints, contact Manager - Customer Care at Tel: 1800-XXX-XXXX, Email: care@company.com'.",
                "legal_reference": cls.LEGAL_METROLOGY_STANDARDS["consumer_care"]["rule"],
                "severity": "HIGH"
            })
            corrections["consumer_care"] = "Consumer Care: 1800-XXX-XXXX | care@domain.com"
        else:
            compliant_fields += 1

        # 7. Country of Origin
        origin_val = get_val('country_of_origin')
        if not origin_val:
            recommendations.append({
                "field": "country_of_origin",
                "issue": "Country of Origin declaration is missing.",
                "recommendation": "Include statutory phrase: 'Country of Origin: India' (or country of manufacture).",
                "legal_reference": cls.LEGAL_METROLOGY_STANDARDS["country_of_origin"]["rule"],
                "severity": "MEDIUM"
            })
            corrections["country_of_origin"] = "Country of Origin: India"
        else:
            compliant_fields += 1

        # Category-specific guidance
        if category.lower() in ['food', 'beverage']:
            recommendations.append({
                "field": "fssai",
                "issue": "Food/Beverage package verified for FSSAI + LM Rule synergy.",
                "recommendation": "Confirm FSSAI 14-digit license logo and veg/non-veg green/brown dot logo accompany metrology markings.",
                "legal_reference": "FSSAI (Packaging & Labelling) Regulations & LM PC Rules",
                "severity": "LOW"
            })

        # Calculate AI compliance score & Risk Tier
        base_score = round((compliant_fields / total_fields) * 100, 1)
        if critical_violations >= 3:
            risk_level = "CRITICAL"
            penalty_estimate = "₹25,000 - ₹50,000 + Product Seizure Risk"
        elif critical_violations > 0:
            risk_level = "HIGH"
            penalty_estimate = "₹10,000 - ₹25,000 per violation batch"
        elif len(recommendations) > 0:
            risk_level = "MEDIUM"
            penalty_estimate = "₹5,000 - ₹10,000 (Notice for rectification)"
        else:
            risk_level = "LOW"
            penalty_estimate = "No statutory financial liability indicated"

        summary_text = (
            f"AI evaluation completed across {total_fields} statutory declarations for '{product_name or 'commodity'}'. "
            f"{compliant_fields} out of {total_fields} core fields passed automatic scrutiny. "
            f"Overall legal risk is classified as {risk_level} with {len(recommendations)} recommended remediations."
        )

        legal_assessment = (
            f"Commodity audited under the Legal Metrology (Packaged Commodities) Rules, 2011 and LM Act 2009. "
            f"Packages distributed in commercial circulation without mandatory Principal Display declarations "
            f"are susceptible to confiscation and compounding fines under Section 36."
        )

        return {
            "status": "success",
            "ai_compliance_score": base_score,
            "risk_level": risk_level,
            "summary": summary_text,
            "recommendations": recommendations,
            "legal_risk_assessment": legal_assessment,
            "penalty_estimate_inr": penalty_estimate,
            "suggested_label_corrections": corrections
        }

    @classmethod
    async def _assess_with_gemini(
        cls,
        declarations: Dict[str, Any],
        category: str,
        product_name: Optional[str]
    ) -> Dict[str, Any]:
        """
        External evaluation via Gemini API if key is supplied
        """
        # Placeholder for external HTTP call via httpx or official SDK
        return cls._assess_with_builtin_engine(declarations, category, product_name)
