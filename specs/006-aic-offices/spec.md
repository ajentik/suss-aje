# Spec 006: Add All AIC (Agency for Integrated Care) Offices

## Problem
SUSS students in social work, gerontology, and healthcare programmes frequently need to interact with AIC. No AIC office data exists in the app.

## Solution
Add all AIC offices and service points across Singapore as POIs.

## Requirements
- Add AIC headquarters and all regional offices to `campus-pois.ts` as category "AIC Office"
- Each office needs: id, name, lat, lng, category, description, address, hours, contact
- Include AIC's key services in descriptions (Caregiver Support, Community Care, Silver Generation Office, etc.)
- Update `campus_info` tool to handle AIC queries
- Update system prompt to mention AIC knowledge

## Key AIC Locations
- **AIC HQ**: 5 Maxwell Road, #10-00 Tower Block, MND Complex, S(069110)
- **Silver Generation Office (SGO)** regional offices across Singapore
- **AIC Link centres** at various community locations
- **Community Care service points**

## AIC Services to Document
- Caregiver Support Services
- Community Care referral
- Silver Generation Office (home visits for seniors)
- Nursing home & day care placement
- Financial assistance schemes (Elderfund, IDAPE, etc.)
- AIC Hotline: 1800-650-6060

## Success Criteria
- User asks "Where is the AIC office?" → navigates to nearest AIC location
- User asks "What does AIC do?" → comprehensive answer via campus_info
- All AIC offices and service points included
