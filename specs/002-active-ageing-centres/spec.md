# Spec 002: Add All Active Ageing Centres of Singapore

## Problem
The campus assistant only knows SUSS campus and nearby venues. It has no data on Active Ageing Centres (AACs) — a critical resource for SUSS's social sciences focus and elderly care programmes.

## Solution
Add all Active Ageing Centres in Singapore as POIs with full metadata. The AI assistant should be able to help users find the nearest AAC, understand services offered, and navigate to them.

## Requirements
- Add all Active Ageing Centres to `campus-pois.ts` as a new category "Active Ageing Centre"
- Each centre needs: id, name, lat, lng, category, description, address, hours (if known)
- Add an `active_ageing_centre` tool or extend `campus_info` to answer AAC queries
- Update system prompt to mention AAC knowledge
- Centres sourced from AIC's official directory (https://www.aic.sg)

## Key AAC Data Points Per Centre
- Name and operator (e.g., NTUC Health, Thye Hua Kwan, Lions Befrienders)
- Full address with postal code
- Lat/lng coordinates
- Services offered (day activities, meals, health screening, befriending, exercise)
- Operating hours
- Contact number if available

## Success Criteria
- User asks "Where's the nearest active ageing centre?" → gets relevant results
- Navigate_to works for AAC destinations
- Complete coverage of Singapore AACs (80+ centres)
