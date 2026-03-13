import type { POI } from "@/types";

/**
 * Agency for Integrated Care (AIC) offices across Singapore.
 *
 * Includes:
 * - AIC Headquarters
 * - AIC Link centres (at major hospitals)
 * - Silver Generation Office (SGO) satellite offices (community outreach)
 *
 * AIC Hotline: 1800-650-6060
 * Mon–Fri 8:30AM–8:30PM, Sat 8:30AM–4PM, Closed Sun & PH
 */

export const AIC_HOTLINE = "1800-650-6060";

export const AIC_OFFICES: POI[] = [
  // ── AIC Headquarters ────────────────────────────────────────
  {
    id: "aic-hq",
    name: "AIC Headquarters",
    lat: 1.2797,
    lng: 103.8459,
    category: "AIC Office",
    description:
      "Agency for Integrated Care HQ. Services: Caregiver Support, ElderFund, ElderShield, nursing home placement, MediSave for Integrated Shield Plans, Home Caregiving Grant (HCG), Seniors' Mobility and Enabling Fund (SMF), AIC Hotline 1800-650-6060.",
    address: "5 Maxwell Road, #10-00 Tower Block, MND Complex, S069110",
    hours: "Mon–Fri 8:30AM–5:30PM",
    contact: AIC_HOTLINE,
  },

  // ── AIC Link Centres (Major Hospitals) ──────────────────────
  {
    id: "aic-link-sgh",
    name: "AIC Link @ Singapore General Hospital",
    lat: 1.2793,
    lng: 103.8358,
    category: "AIC Office",
    description:
      "AIC Link at SGH, near Koufu Food Court. Walk-in advice on care services, financial assistance (ElderFund, CHAS, HCG, SMF), caregiver training grants, nursing home/day care placement, and dementia support.",
    address: "Outram Road, Singapore General Hospital, S169608",
    hours: "Mon–Fri 8:30AM–5:30PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "aic-link-ttsh",
    name: "AIC Link @ Tan Tock Seng Hospital",
    lat: 1.3215,
    lng: 103.8467,
    category: "AIC Office",
    description:
      "AIC Link at TTSH. Walk-in advice on care services, financial assistance (ElderFund, CHAS, HCG, SMF), caregiver training grants, nursing home/day care placement, and dementia support.",
    address: "11 Jalan Tan Tock Seng, S308433",
    hours: "Mon–Fri 8:30AM–5:30PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "aic-link-cgh",
    name: "AIC Link @ Changi General Hospital",
    lat: 1.3401,
    lng: 103.9494,
    category: "AIC Office",
    description:
      "AIC Link at CGH. Walk-in advice on care services, financial assistance (ElderFund, CHAS, HCG, SMF), caregiver training grants, nursing home/day care placement, and dementia support.",
    address: "2 Simei Street 3, S529889",
    hours: "Mon–Fri 8:30AM–5:30PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "aic-link-ktph",
    name: "AIC Link @ Khoo Teck Puat Hospital",
    lat: 1.4244,
    lng: 103.8381,
    category: "AIC Office",
    description:
      "AIC Link at KTPH. Walk-in advice on care services, financial assistance (ElderFund, CHAS, HCG, SMF), caregiver training grants, nursing home/day care placement, and dementia support.",
    address: "90 Yishun Central, S768828",
    hours: "Mon–Fri 8:30AM–5:30PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "aic-link-nuh",
    name: "AIC Link @ National University Hospital",
    lat: 1.2936,
    lng: 103.7831,
    category: "AIC Office",
    description:
      "AIC Link at NUH. Walk-in advice on care services, financial assistance (ElderFund, CHAS, HCG, SMF), caregiver training grants, nursing home/day care placement, and dementia support.",
    address: "5 Lower Kent Ridge Road, S119074",
    hours: "Mon–Fri 8:30AM–5:30PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "aic-link-skh",
    name: "AIC Link @ Sengkang General Hospital",
    lat: 1.3944,
    lng: 103.8935,
    category: "AIC Office",
    description:
      "AIC Link at SKH. Walk-in advice on care services, financial assistance (ElderFund, CHAS, HCG, SMF), caregiver training grants, nursing home/day care placement, and dementia support.",
    address: "110 Sengkang East Way, S544886",
    hours: "Mon–Fri 8:30AM–5:30PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "aic-link-ntfgh",
    name: "AIC Link @ Ng Teng Fong General Hospital",
    lat: 1.3331,
    lng: 103.7457,
    category: "AIC Office",
    description:
      "AIC Link at NTFGH. Walk-in advice on care services, financial assistance (ElderFund, CHAS, HCG, SMF), caregiver training grants, nursing home/day care placement, and dementia support.",
    address: "1 Jurong East Street 21, S609606",
    hours: "Mon–Fri 8:30AM–5:30PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "aic-link-ach",
    name: "AIC Link @ Alexandra Hospital",
    lat: 1.2864,
    lng: 103.7991,
    category: "AIC Office",
    description:
      "AIC Link at Alexandra Hospital. Walk-in advice on care services, financial assistance (ElderFund, CHAS, HCG, SMF), caregiver training grants, nursing home/day care placement, and dementia support.",
    address: "378 Alexandra Road, S159964",
    hours: "Mon–Fri 8:30AM–5:30PM",
    contact: AIC_HOTLINE,
  },

  // ── Silver Generation Office (SGO) Satellite Offices ────────
  // SGO volunteers conduct door-to-door outreach to seniors,
  // connecting them to care services, health screenings, and
  // community programmes.
  {
    id: "sgo-ang-mo-kio",
    name: "SGO – Ang Mo Kio",
    lat: 1.3750,
    lng: 103.8490,
    category: "AIC Office",
    description:
      "Silver Generation Office for Ang Mo Kio (Central Cluster). Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "723 Ang Mo Kio Ave 8, S560723",
    hours: "Mon–Fri 9AM–6PM",
    contact: "6553 6016",
  },
  {
    id: "sgo-bishan-toa-payoh",
    name: "SGO – Bishan-Toa Payoh",
    lat: 1.3340,
    lng: 103.8500,
    category: "AIC Office",
    description:
      "Silver Generation Office for Bishan-Toa Payoh (Central Cluster). Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Blk 125A Lorong 2 Toa Payoh, #02-136, S311125",
    hours: "Mon–Fri 9AM–6PM",
    contact: "6956 7014",
  },
  {
    id: "sgo-jalan-besar",
    name: "SGO – Jalan Besar",
    lat: 1.3128,
    lng: 103.8580,
    category: "AIC Office",
    description:
      "Silver Generation Office for Jalan Besar (Central Cluster). Located at Kwong Wai Shiu Hospital. Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Kwong Wai Shiu Hospital, 705 Serangoon Road, Block A #02-03, S328127",
    hours: "Mon–Fri 9AM–6PM",
    contact: "6296 1013",
  },
  {
    id: "sgo-tanjong-pagar",
    name: "SGO – Tanjong Pagar",
    lat: 1.2754,
    lng: 103.8415,
    category: "AIC Office",
    description:
      "Silver Generation Office for Tanjong Pagar (South Cluster). Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Blk 1 Everton Park, #01-27, S081001",
    hours: "Mon–Fri 9AM–6PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "sgo-marine-parade",
    name: "SGO – Marine Parade",
    lat: 1.3020,
    lng: 103.9059,
    category: "AIC Office",
    description:
      "Silver Generation Office for Marine Parade (South Cluster). Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Blk 50 Marine Terrace, #01-260, S440050",
    hours: "Mon–Fri 9AM–6PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "sgo-east-coast",
    name: "SGO – East Coast",
    lat: 1.3260,
    lng: 103.9310,
    category: "AIC Office",
    description:
      "Silver Generation Office for East Coast (East Cluster). Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Blk 124 Bedok North Road, #01-133, S460124",
    hours: "Mon–Fri 9AM–6PM",
    contact: "6636 2535",
  },
  {
    id: "sgo-aljunied",
    name: "SGO – Aljunied",
    lat: 1.3581,
    lng: 103.8862,
    category: "AIC Office",
    description:
      "Silver Generation Office for Aljunied (East Cluster). Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Punggol Community Club, 3 Hougang Ave 6, #01-02, S538808",
    hours: "Mon–Fri 9AM–6PM",
    contact: "6383 6022",
  },
  {
    id: "sgo-tampines",
    name: "SGO – Tampines",
    lat: 1.3535,
    lng: 103.9395,
    category: "AIC Office",
    description:
      "Silver Generation Office for Tampines (East Cluster). Located at Our Tampines Hub. Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Our Tampines Hub, 1 Tampines Walk, #04-35, S528523",
    hours: "Mon–Fri 9AM–6PM",
    contact: "6587 6925",
  },
  {
    id: "sgo-pasir-ris-punggol",
    name: "SGO – Pasir Ris-Punggol",
    lat: 1.3917,
    lng: 103.8951,
    category: "AIC Office",
    description:
      "Silver Generation Office for Pasir Ris-Punggol (East Cluster). Located at Sengkang Community Club. Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Sengkang Community Club, 2 Sengkang Square, #05-01, S545025",
    hours: "Mon–Fri 9AM–6PM",
    contact: "6636 2760",
  },
  {
    id: "sgo-sengkang",
    name: "SGO – Sengkang",
    lat: 1.3916,
    lng: 103.8943,
    category: "AIC Office",
    description:
      "Silver Generation Office for Sengkang (East Cluster). Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Blk 257C Compassvale Road, #01-05, S543257",
    hours: "Mon–Fri 9AM–6PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "sgo-holland-bukit-timah",
    name: "SGO – Holland-Bukit Timah",
    lat: 1.3112,
    lng: 103.7887,
    category: "AIC Office",
    description:
      "Silver Generation Office for Holland-Bukit Timah (North Cluster). Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Blk 3 Ghim Moh Road, #01-271, S270003",
    hours: "Mon–Fri 9AM–6PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "sgo-west-coast",
    name: "SGO – West Coast",
    lat: 1.3048,
    lng: 103.7550,
    category: "AIC Office",
    description:
      "Silver Generation Office for West Coast (West Cluster). Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Blk 502 West Coast Drive, #01-169, S120502",
    hours: "Mon–Fri 9AM–6PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "sgo-jurong",
    name: "SGO – Jurong",
    lat: 1.3387,
    lng: 103.7290,
    category: "AIC Office",
    description:
      "Silver Generation Office for Jurong (West Cluster). Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Blk 334 Jurong East Ave 1, #01-07, S600334",
    hours: "Mon–Fri 9AM–6PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "sgo-choa-chu-kang",
    name: "SGO – Choa Chu Kang",
    lat: 1.3851,
    lng: 103.7468,
    category: "AIC Office",
    description:
      "Silver Generation Office for Choa Chu Kang (West Cluster). Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Blk 304 Choa Chu Kang Ave 4, #01-665, S680304",
    hours: "Mon–Fri 9AM–6PM",
    contact: AIC_HOTLINE,
  },
  {
    id: "sgo-marsiling-yew-tee",
    name: "SGO – Marsiling-Yew Tee",
    lat: 1.3970,
    lng: 103.7470,
    category: "AIC Office",
    description:
      "Silver Generation Office for Marsiling-Yew Tee (North Cluster). Located at Yew Tee Community Building. Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Yew Tee Community Building, 20 Choa Chu Kang Street 52, #03-06/#03-07, S689286",
    hours: "Mon–Fri 9AM–6PM",
    contact: "6363 7401",
  },
  {
    id: "sgo-nee-soon",
    name: "SGO – Nee Soon",
    lat: 1.4290,
    lng: 103.8370,
    category: "AIC Office",
    description:
      "Silver Generation Office for Nee Soon (North Cluster). Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Blk 234 Yishun Street 21, #01-418, S760234",
    hours: "Mon–Fri 9AM–6PM",
    contact: "6956 7100",
  },
  {
    id: "sgo-sembawang",
    name: "SGO – Sembawang",
    lat: 1.4378,
    lng: 103.7877,
    category: "AIC Office",
    description:
      "Silver Generation Office for Sembawang (North Cluster). Located at Woodlands Galaxy Community Club. Volunteer-led senior outreach: functional screening, care service referrals, health education, befriending, and community programme enrolment.",
    address: "Woodlands Galaxy Community Club, 31 Woodlands Ave 6, #04-01/#04-05, S738991",
    hours: "Mon–Fri 9AM–6PM",
    contact: "6767 1406",
  },
];
