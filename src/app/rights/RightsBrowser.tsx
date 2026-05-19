"use client";

import { useState } from "react";
import Link from "next/link";

// ── types ─────────────────────────────────────────────────────────────────────

interface Source {
  label: string;
  url: string;
}

interface RightsCard {
  id: string;
  title: string;
  summary: string;
  canDo: string[];
  theyCanDo: string[];
  action: string;
  sources: Source[];
}

interface RightsCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  cards: RightsCard[];
}

type Tab = "federal" | "state" | "local";

// ── icons ─────────────────────────────────────────────────────────────────────

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function VoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M3 6l9-3 9 3" />
      <path d="M3 6l4 8H3l4-8z" />
      <path d="M21 6l-4 8h4l-4-8z" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 19.96l1.63 1a1.09 1.09 0 0 0 1.25-.19C6.74 20.66 8.7 20 12 20c7 0 10-5 10-10C22 5 17 3 17 8z" />
      <path d="M3.82 19.96C2.84 17.56 2 14 2 12c0-5 3-6 3-6" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ── rights data ───────────────────────────────────────────────────────────────

const FEDERAL_CATEGORIES: RightsCategory[] = [
  {
    id: "first-amendment",
    label: "First Amendment",
    icon: <ShieldIcon />,
    cards: [
      {
        id: "first-amendment-main",
        title: "Freedom of Speech, Assembly & Press",
        summary:
          "The First Amendment protects your right to speak, assemble, and publish without government interference. It does not protect all speech in all situations.",
        canDo: [
          "Criticize government officials and policies — even harshly.",
          "Protest in public spaces (sidewalks, parks, plazas).",
          "Film police officers performing their duties in public.",
          "Publish, blog, post, and broadcast without prior government approval.",
          "Practice any religion — or no religion — without interference.",
          "Remain silent when asked your opinion by police.",
        ],
        theyCanDo: [
          "Impose reasonable time, place, and manner restrictions on protests (permit requirements, noise ordinances).",
          "Arrest you for speech that constitutes a 'true threat' or incitement to imminent lawless action.",
          "Enforce viewpoint-neutral laws — they cannot treat groups differently based on their message.",
          "Require parade permits for large marches on public roads.",
        ],
        action:
          "If police order you to disperse, ask clearly: 'Am I being detained, or am I free to go?' Document officer badge numbers and names. If arrested for speech, do not resist — challenge it in court. Note the exact time, location, and what was said.",
        sources: [
          { label: "U.S. Const. amend. I", url: "https://constitution.congress.gov/constitution/amendment-1/" },
          { label: "Brandenburg v. Ohio, 395 U.S. 444 (1969)", url: "https://supreme.justia.com/cases/federal/us/395/444/" },
          { label: "NAACP v. Claiborne Hardware, 458 U.S. 886 (1982)", url: "https://supreme.justia.com/cases/federal/us/458/886/" },
          { label: "Reed v. Town of Gilbert, 576 U.S. 155 (2015)", url: "https://supreme.justia.com/cases/federal/us/576/155/" },
        ],
      },
    ],
  },
  {
    id: "fourth-amendment",
    label: "Fourth Amendment",
    icon: <ShieldIcon />,
    cards: [
      {
        id: "fourth-amendment-main",
        title: "Search & Seizure — Your Home, Car, and Person",
        summary:
          "The Fourth Amendment protects you from unreasonable searches and seizures. Police generally need a warrant based on probable cause — but there are significant exceptions.",
        canDo: [
          "Refuse consent to search your home, car, or bags.",
          "Ask to see a warrant before allowing entry into your home.",
          "Remain silent about the contents of your belongings.",
          "Ask 'Am I being detained?' at any traffic stop.",
          "Refuse to allow police into your home without a judicial warrant — an ICE administrative warrant does not give entry rights.",
          "Film police during a traffic stop from a safe distance.",
        ],
        theyCanDo: [
          "Search with a valid warrant signed by a judge.",
          "Search incident to a lawful arrest (your person and immediate area).",
          "Conduct a pat-down ('Terry stop') if they have reasonable suspicion you're armed and dangerous.",
          "Search if they have probable cause to believe contraband is present in a vehicle.",
          "Seize items in 'plain view' without a warrant.",
          "Search with your voluntary consent.",
          "Conduct checkpoint stops (DUI, border within 100 miles).",
        ],
        action:
          "Say clearly: 'I do not consent to this search.' Do NOT physically resist even if the search is unlawful — your remedy is in court, not in the street. At a traffic stop, stay calm, provide license/registration/insurance when asked, and note the officer's badge number.",
        sources: [
          { label: "U.S. Const. amend. IV", url: "https://constitution.congress.gov/constitution/amendment-4/" },
          { label: "Terry v. Ohio, 392 U.S. 1 (1968)", url: "https://supreme.justia.com/cases/federal/us/392/1/" },
          { label: "Riley v. California, 573 U.S. 373 (2014) (cell phones)", url: "https://supreme.justia.com/cases/federal/us/573/373/" },
          { label: "United States v. Jones, 565 U.S. 400 (2012) (GPS)", url: "https://supreme.justia.com/cases/federal/us/565/400/" },
          { label: "Carpenter v. United States, 585 U.S. 296 (2018) (cell data)", url: "https://supreme.justia.com/cases/federal/us/585/296/" },
        ],
      },
    ],
  },
  {
    id: "fifth-amendment",
    label: "Fifth Amendment",
    icon: <ShieldIcon />,
    cards: [
      {
        id: "fifth-amendment-main",
        title: "Right to Remain Silent & Self-Incrimination",
        summary:
          "You have the right not to be a witness against yourself. You must actively invoke this right — staying silent alone may not be enough since Berghuis v. Thompkins (2010).",
        canDo: [
          "Refuse to answer any questions from police, FBI, or any government agent.",
          "Invoke your right to remain silent at any time — before or after arrest.",
          "Demand an attorney before any questioning.",
          "Refuse to provide a password or decrypt a device (Fifth Amendment protects against compelled decryption in most circuits).",
          "Leave a police encounter without answering questions if you are not detained.",
        ],
        theyCanDo: [
          "Ask you questions — you simply don't have to answer.",
          "Arrest you without reading Miranda rights if they are not interrogating you in custody.",
          "Use any voluntary statements you make against you.",
          "Ask a grand jury to compel your testimony (but you may still invoke the Fifth).",
          "Offer immunity and then compel testimony.",
        ],
        action:
          "Say these exact words: 'I am invoking my Fifth Amendment right to remain silent and I want a lawyer.' Then stop talking. Do not explain yourself, apologize, or make small talk. Once you invoke, all questioning must stop until your attorney is present.",
        sources: [
          { label: "U.S. Const. amend. V", url: "https://constitution.congress.gov/constitution/amendment-5/" },
          { label: "Miranda v. Arizona, 384 U.S. 436 (1966)", url: "https://supreme.justia.com/cases/federal/us/384/436/" },
          { label: "Berghuis v. Thompkins, 560 U.S. 370 (2010)", url: "https://supreme.justia.com/cases/federal/us/560/370/" },
          { label: "Salinas v. Texas, 570 U.S. 178 (2013)", url: "https://supreme.justia.com/cases/federal/us/570/178/" },
        ],
      },
    ],
  },
  {
    id: "voting-rights",
    label: "Voting Rights",
    icon: <VoteIcon />,
    cards: [
      {
        id: "voting-rights-main",
        title: "Your Right to Vote",
        summary:
          "The right to vote is protected by the 15th, 19th, 24th, and 26th Amendments and the Voting Rights Act. No one can be denied the right to vote based on race, sex, failure to pay a poll tax, or age (18+).",
        canDo: [
          "Register to vote if you are a U.S. citizen, 18 or older, and a resident of your state.",
          "Vote in any language if your jurisdiction is covered under the Voting Rights Act's minority language provisions.",
          "Bring a person to assist you in the voting booth if you have a disability.",
          "Request a provisional ballot if your registration is questioned — every polling place must provide one.",
          "Take up to two hours of paid leave to vote in most states (varies by state).",
          "Have assistance filling out your ballot if needed.",
        ],
        theyCanDo: [
          "Require voter registration before Election Day (deadlines vary by state).",
          "Require photo ID in many states (WA does not require photo ID).",
          "Set reasonable voting hours and polling locations.",
          "Purge voter rolls under specific procedures required by federal law.",
        ],
        action:
          "If you are turned away at the polls or told you are not registered, ask for a provisional ballot. By federal law (HAVA), every polling location must give you one. Fill it out completely. Contact your state's election hotline or call 1-866-OUR-VOTE to report problems.",
        sources: [
          { label: "Voting Rights Act of 1965, 52 U.S.C. § 10301", url: "https://www.justice.gov/crt/voting-rights-act-original-text" },
          { label: "Help America Vote Act (HAVA), 52 U.S.C. § 21082", url: "https://www.eac.gov/about-the-useac/help-america-vote-act" },
          { label: "National Voter Registration Act, 52 U.S.C. § 20501", url: "https://www.justice.gov/crt/national-voter-registration-act-1993-nvra" },
          { label: "U.S. Const. amends. XV, XIX, XXIV, XXVI", url: "https://constitution.congress.gov/constitution/amendment-15/" },
        ],
      },
    ],
  },
  {
    id: "civil-rights",
    label: "Civil Rights",
    icon: <ScaleIcon />,
    cards: [
      {
        id: "civil-rights-main",
        title: "Workplace, Housing & Equal Protection",
        summary:
          "Federal law prohibits discrimination based on race, color, national origin, sex, religion, disability, and age in employment, housing, and programs receiving federal funding.",
        canDo: [
          "File an EEOC complaint if you face workplace discrimination based on a protected class.",
          "Request reasonable accommodations for a disability at work — employers must provide them unless it causes undue hardship.",
          "File a fair housing complaint with HUD if denied housing due to race, color, religion, sex, national origin, familial status, or disability.",
          "File a Title IX complaint if you face sex discrimination at a school receiving federal funds.",
          "File a Section 1983 civil rights lawsuit against government officials who violate your constitutional rights.",
        ],
        theyCanDo: [
          "Reject job applicants for legitimate, non-discriminatory reasons.",
          "Set bona fide occupational qualifications (e.g., a religious organization may require members of that faith).",
          "Conduct background checks that are applied consistently and are job-related.",
        ],
        action:
          "Document everything in writing — dates, witnesses, what was said. File an EEOC charge within 300 days of the discriminatory act. File a HUD complaint within one year. Keep copies of all correspondence. Contact a civil rights attorney — many take cases on contingency.",
        sources: [
          { label: "Civil Rights Act of 1964, Title VII — 42 U.S.C. § 2000e", url: "https://www.eeoc.gov/statutes/title-vii-civil-rights-act-1964" },
          { label: "Americans with Disabilities Act — 42 U.S.C. § 12101", url: "https://www.ada.gov/law-and-regs/ada/" },
          { label: "Fair Housing Act — 42 U.S.C. § 3601", url: "https://www.hud.gov/program_offices/fair_housing_equal_opp/fair_housing_act_overview" },
          { label: "Title IX — 20 U.S.C. § 1681", url: "https://www.justice.gov/crt/title-ix" },
          { label: "42 U.S.C. § 1983 (Civil rights lawsuits)", url: "https://www.law.cornell.edu/uscode/text/42/1983" },
        ],
      },
    ],
  },
  {
    id: "immigration",
    label: "Immigration Enforcement",
    icon: <GlobeIcon />,
    cards: [
      {
        id: "immigration-main",
        title: "Rights During Immigration Encounters",
        summary:
          "The Fourth and Fifth Amendments protect everyone in the United States — regardless of immigration status. You have the right to remain silent and the right to an attorney.",
        canDo: [
          "Remain silent. You do not have to answer questions about your immigration status.",
          "Refuse to open your door unless officers present a judicial warrant signed by a judge (not an ICE administrative 'warrant').",
          "Ask to speak with a lawyer before signing any documents.",
          "Refuse to sign anything you do not understand.",
          "Record the encounter if safe to do so.",
          "Contact your consulate — detained foreign nationals have the right to consular notification under the Vienna Convention.",
        ],
        theyCanDo: [
          "Arrest someone at or between ports of entry without a warrant (border zone enforcement).",
          "Operate immigration checkpoints within 100 miles of U.S. borders.",
          "Enter private premises with a judicial warrant or consent.",
          "Detain someone if they have reasonable suspicion of removability.",
        ],
        action:
          "Do NOT open your door unless officers slide a judicial warrant (signed by a judge with your name and address) under the door. If detained, say: 'I am exercising my right to remain silent. I want to speak with a lawyer.' Do not sign anything. Keep emergency contact numbers memorized — phones may be confiscated.",
        sources: [
          { label: "INA § 287 — 8 U.S.C. § 1357 (ICE authority)", url: "https://www.law.cornell.edu/uscode/text/8/1357" },
          { label: "INS v. Delgado, 466 U.S. 210 (1984)", url: "https://supreme.justia.com/cases/federal/us/466/210/" },
          { label: "Zadvydas v. Davis, 533 U.S. 678 (2001)", url: "https://supreme.justia.com/cases/federal/us/533/678/" },
          { label: "DHS Know Your Rights — ice.gov", url: "https://www.ice.gov/know-your-rights" },
          { label: "Vienna Convention on Consular Relations, Art. 36", url: "https://legal.un.org/ilc/texts/instruments/english/conventions/9_2_1963.pdf" },
        ],
      },
    ],
  },
];

const STATE_CATEGORIES: RightsCategory[] = [
  {
    id: "wa-voting",
    label: "Voting in Washington",
    icon: <VoteIcon />,
    cards: [
      {
        id: "wa-voting-main",
        title: "Washington State Voting Rights",
        summary:
          "Washington makes voting easy. Every registered voter receives a mail ballot automatically. No photo ID is required. Same-day registration is available.",
        canDo: [
          "Register to vote up to and including Election Day (same-day registration available).",
          "Vote entirely by mail — a ballot is mailed to every registered voter 18 days before each election.",
          "Drop your ballot at any official drop box in your county — no stamp required.",
          "Register with any address where you sleep most nights, including a shelter or your car.",
          "Vote if you were formerly incarcerated and have completed your sentence.",
          "Vote without showing photo ID — Washington uses signature verification, not photo ID.",
          "Restore your voting rights automatically upon release from prison.",
        ],
        theyCanDo: [
          "Require a valid Washington State address for registration.",
          "Compare your signature on the ballot envelope to your registration signature.",
          "Contact you to 'cure' a signature mismatch before rejecting your ballot.",
          "Require citizenship — only U.S. citizens may vote in state and federal elections.",
        ],
        action:
          "Register at VoteWA.gov. If you do not receive your ballot by 18 days before the election, contact your county auditor. Ballots must be postmarked by Election Day or dropped in an official drop box by 8 PM on Election Day. Check your ballot status at VoteWA.gov.",
        sources: [
          { label: "RCW 29A.08.140 — Voter registration deadline", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=29A.08.140" },
          { label: "RCW 29A.40.010 — Vote-by-mail", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=29A.40.010" },
          { label: "RCW 29A.08.520 — Re-enfranchisement after incarceration", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=29A.08.520" },
          { label: "VoteWA.gov — Official voter registration portal", url: "https://www.votewa.gov" },
        ],
      },
    ],
  },
  {
    id: "tenant-rights",
    label: "Tenant Rights",
    icon: <HomeIcon />,
    cards: [
      {
        id: "tenant-rights-main",
        title: "Washington Residential Landlord-Tenant Act",
        summary:
          "Washington's RLTA (RCW 59.18) gives tenants strong protections. Just Cause Eviction rules restrict when landlords can terminate tenancy.",
        canDo: [
          "Withhold rent (or request repairs) if your landlord fails to maintain habitable conditions after proper written notice.",
          "Receive at least 20 days written notice before a rent increase — 180 days for increases over 3% or the CPI.",
          "Demand your security deposit itemization and return within 30 days of move-out.",
          "Require a 'just cause' reason for eviction after you've lived there 20+ days (e.g., nonpayment, lease violation, owner move-in).",
          "Sue in small claims court for up to 2x the amount of wrongfully withheld security deposit.",
          "Terminate a lease early without penalty if you are a survivor of domestic violence (with documentation).",
        ],
        theyCanDo: [
          "Terminate tenancy with just cause as defined in RCW 59.18.650.",
          "Collect a security deposit (no statutory cap in WA, but it must be returned with itemized deductions).",
          "Enter your unit with 2 days' written notice for non-emergency repairs.",
          "Enter without notice in a genuine emergency.",
          "Screen tenants using criminal history and credit (subject to Seattle and other local rules).",
        ],
        action:
          "All notices — pay-or-vacate, cure-or-vacate, and termination — must be in writing and served properly. Respond in writing to every notice. Never ignore an eviction notice — you have the right to a court hearing. Contact 2-1-1 or a local tenant's union for free legal help.",
        sources: [
          { label: "RCW 59.18 — Residential Landlord-Tenant Act", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=59.18" },
          { label: "RCW 59.18.650 — Just Cause Eviction", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=59.18.650" },
          { label: "RCW 59.18.280 — Security deposit return (30 days)", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=59.18.280" },
          { label: "2eSHB 1620 (2023) — Rent increase notice (180 days)", url: "https://app.leg.wa.gov/billsummary?BillNumber=1620&Year=2023" },
        ],
      },
    ],
  },
  {
    id: "recording-police",
    label: "Recording Police",
    icon: <CameraIcon />,
    cards: [
      {
        id: "recording-police-main",
        title: "You Have the Right to Record Police in Public",
        summary:
          "Washington is a two-party consent state for private conversations — but recording police officers performing their duties in public does not require their consent.",
        canDo: [
          "Record police officers in public spaces while they perform their duties.",
          "Photograph or video an arrest, traffic stop, or any police action visible from a public location.",
          "Post recordings publicly — this is protected First Amendment activity.",
          "Record from a safe distance without interfering with police activity.",
          "Refuse to delete recordings if police demand it — they generally may not delete lawfully made recordings without a warrant.",
        ],
        theyCanDo: [
          "Order you to move back if you are physically interfering with police activity.",
          "Seize your phone as evidence with a valid warrant (but must not view contents without a warrant — Riley v. California).",
          "Arrest you under RCW 9.73.030 if you secretly record a private conversation without consent — but public police activity is not a private conversation.",
        ],
        action:
          "Stay back far enough that you are not physically interfering. Keep your phone visible and say clearly: 'I am recording from a public location and I have the right to do so.' If police try to stop you, do not resist — invoke your right verbally and challenge it later. Back up footage to cloud immediately.",
        sources: [
          { label: "RCW 9.73.030 — Privacy Act (two-party consent)", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=9.73.030" },
          { label: "RCW 9.73.010 — Definition of 'private affairs'", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=9.73.010" },
          { label: "Gerlich v. Leath, 861 F.3d 697 (8th Cir. 2017)", url: "https://law.justia.com/cases/federal/appellate-courts/ca8/16-1464/16-1464-2017-07-07.html" },
          { label: "ACLU of WA — Know Your Rights: Photography", url: "https://www.aclu-wa.org/know-your-rights" },
        ],
      },
    ],
  },
  {
    id: "stop-identify",
    label: "Stop and Identify",
    icon: <PersonIcon />,
    cards: [
      {
        id: "stop-identify-main",
        title: "Washington Does NOT Have a Stop-and-Identify Law",
        summary:
          "Unlike 24 other states, Washington has no statute requiring you to identify yourself to police simply because they ask. You are generally not required to show ID unless you are driving or under arrest.",
        canDo: [
          "Refuse to provide your name or ID to police if you are not driving and not under arrest.",
          "Ask 'Am I being detained?' If the answer is no, you are free to leave.",
          "Remain silent about your identity during a Terry stop (brief investigative detention).",
          "If you are a passenger in a vehicle, generally decline to provide ID (unless required by local ordinance in some jurisdictions — ask if there is a specific law requiring it).",
        ],
        theyCanDo: [
          "Detain you briefly (Terry stop) if they have reasonable, articulable suspicion of criminal activity.",
          "Require drivers to produce a driver's license, registration, and proof of insurance (RCW 46.61.020).",
          "Require identification at the time of arrest.",
          "Ask for your name and ID — you just don't have to provide it if you're not driving and not arrested.",
        ],
        action:
          "Ask clearly: 'Am I being detained or am I free to go?' If detained, ask why. If not detained, you may leave. If detained, you may remain silent. Do not provide a false name — that can be a crime. Providing your real name is always the safer choice if you choose to speak at all.",
        sources: [
          { label: "RCW 46.61.020 — Driver's license required (drivers only)", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=46.61.020" },
          { label: "State v. Rankin, 190 Wn.2d 774 (2018)", url: "https://www.courts.wa.gov/opinions/pdf/951494.pdf" },
          { label: "Terry v. Ohio, 392 U.S. 1 (1968)", url: "https://supreme.justia.com/cases/federal/us/392/1/" },
          { label: "WA State Legislature — No stop-and-identify statute enacted", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=9a.76" },
        ],
      },
    ],
  },
  {
    id: "cannabis",
    label: "Cannabis Laws",
    icon: <LeafIcon />,
    cards: [
      {
        id: "cannabis-main",
        title: "Washington Cannabis Law (Adults 21+)",
        summary:
          "Washington legalized recreational cannabis in 2012 via Initiative 502. Adults 21 and older may possess and purchase cannabis. Public consumption and driving under the influence remain illegal.",
        canDo: [
          "Possess up to 1 ounce (28.3g) of useable cannabis (flower).",
          "Possess up to 16 grams of cannabis concentrate.",
          "Possess up to 72 ounces of cannabis-infused products (e.g., edibles).",
          "Purchase cannabis from a licensed retailer.",
          "Grow cannabis for medical use if you are a registered medical patient (up to 6 plants per patient, up to 15 per household with multiple patients).",
          "Transport legal quantities in your vehicle in closed packaging (not in the passenger compartment while open).",
        ],
        theyCanDo: [
          "Arrest you for possession of amounts over the legal limit.",
          "Arrest you for consuming cannabis in public (class 1 civil infraction, $27 fine — or more in some jurisdictions).",
          "Test you for impairment while driving (5 ng/mL THC blood limit, but impairment can be found below that threshold).",
          "Prohibit cannabis on federal property, federal housing, or in vehicles crossing federal borders.",
          "Employers may still require drug-free workplaces and test for cannabis (RCW 49.44.240 protects medical cannabis users from some discrimination but exceptions apply).",
        ],
        action:
          "Do not consume cannabis in public, in a vehicle, or in view of minors. Do not cross state or federal borders with cannabis — it remains a federal Schedule I controlled substance. If your employer drug tests, know their policy before consuming, even recreationally.",
        sources: [
          { label: "RCW 69.50.4014 — Personal use amounts", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=69.50.4014" },
          { label: "RCW 46.61.502 — Driving under the influence (cannabis)", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=46.61.502" },
          { label: "RCW 69.50.445 — No public consumption", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=69.50.445" },
          { label: "RCW 49.44.240 — Medical cannabis employment protections", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=49.44.240" },
          { label: "Initiative 502 — Original ballot measure (2012)", url: "https://ballotpedia.org/Washington_Initiative_502_(2012)" },
        ],
      },
    ],
  },
  {
    id: "worker-rights",
    label: "Worker Rights",
    icon: <BriefcaseIcon />,
    cards: [
      {
        id: "worker-rights-main",
        title: "Washington State Worker Protections",
        summary:
          "Washington has some of the strongest worker protections in the country — including a minimum wage above the federal floor, paid sick leave, and paid family and medical leave.",
        canDo: [
          "Earn at least Washington's minimum wage ($16.66/hr in 2025, indexed annually to CPI). Seattle, SeaTac, and other cities set higher local minimums.",
          "Earn 1.5x overtime pay for hours over 40 per week (most workers — some exemptions apply).",
          "Accrue paid sick leave: 1 hour for every 40 hours worked, usable after 90 days.",
          "Apply for Paid Family and Medical Leave (PFML) through the state for parental leave, serious health conditions, or military family leave.",
          "File an L&I complaint if your workplace is unsafe or if wages are withheld.",
          "Organize and join a union without retaliation (National Labor Relations Act).",
          "Discuss your wages with coworkers — employers cannot prohibit this.",
        ],
        theyCanDo: [
          "Classify some workers as exempt from overtime (executive, administrative, professional — salary must be ≥ $1,302.40/week in WA in 2025).",
          "Discipline or terminate employees for legitimate, non-protected reasons.",
          "Require at-will employment (WA is an at-will state).",
          "Deduct from wages for uniforms, tools, or meals only if they don't bring pay below minimum wage and the employee consents in writing.",
        ],
        action:
          "If wages are withheld, file a wage claim with L&I online at lni.wa.gov — there's no filing fee and L&I investigates on your behalf. Claims must be filed within 3 years. For workplace safety hazards, file a confidential complaint with L&I WISHA. Retaliation for reporting is illegal.",
        sources: [
          { label: "RCW 49.46.020 — Minimum wage", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=49.46.020" },
          { label: "RCW 49.46.130 — Overtime requirements", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=49.46.130" },
          { label: "RCW 49.46.210 — Paid sick leave", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=49.46.210" },
          { label: "RCW 50A — Paid Family and Medical Leave", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=50A" },
          { label: "National Labor Relations Act — 29 U.S.C. § 151", url: "https://www.nlrb.gov/guidance/key-reference-materials/national-labor-relations-act" },
          { label: "L&I Wage complaint — lni.wa.gov", url: "https://lni.wa.gov/workers-rights/wages-and-overtime/file-a-wage-complaint" },
        ],
      },
    ],
  },
];

const WA_SANCTUARY_CITIES = [
  "Seattle", "King County", "Snohomish County", "Thurston County",
  "Pierce County", "Spokane", "Bellingham", "Olympia", "Tacoma",
];

// ── accordion card ────────────────────────────────────────────────────────────

function RightsAccordion({ card }: { card: RightsCard }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-brand-light-gray/20 dark:hover:bg-brand-dark-gray/60 transition-colors"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-navy dark:text-brand-off-white text-base leading-snug">
            {card.title}
          </p>
          {!open && (
            <p className="mt-1 text-sm text-brand-navy/55 dark:text-brand-off-white/50 leading-relaxed line-clamp-2">
              {card.summary}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 mt-0.5 text-brand-navy/40 dark:text-brand-off-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-brand-light-gray/50 dark:border-brand-dark-gray/80 pt-4">
          {/* Summary */}
          <p className="text-sm leading-relaxed text-brand-navy/70 dark:text-brand-off-white/65">
            {card.summary}
          </p>

          {/* Two-column rights grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* What you can do */}
            <div className="rounded-lg bg-brand-light-blue/20 dark:bg-brand-primary/10 border border-brand-light-blue/50 dark:border-brand-primary/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary dark:text-brand-light-blue mb-2.5">
                What you can do
              </p>
              <ul className="space-y-1.5">
                {card.canDo.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-brand-navy/75 dark:text-brand-off-white/70 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary dark:bg-brand-light-blue shrink-0 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What they can do */}
            <div className="rounded-lg bg-brand-light-gray/30 dark:bg-brand-charcoal/40 border border-brand-light-gray/60 dark:border-brand-dark-gray/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/50 dark:text-brand-off-white/40 mb-2.5">
                What they can do
              </p>
              <ul className="space-y-1.5">
                {card.theyCanDo.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-brand-navy/65 dark:text-brand-off-white/55 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-mid-gray shrink-0 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action box */}
          <div className="rounded-lg bg-brand-red/8 dark:bg-brand-red/12 border border-brand-red/25 dark:border-brand-red/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-red mb-2">
              What to do right now
            </p>
            <p className="text-sm leading-relaxed text-brand-navy/80 dark:text-brand-off-white/75">
              {card.action}
            </p>
          </div>

          {/* Sources */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/40 dark:text-brand-off-white/35 mb-2">
              Sources
            </p>
            <ul className="space-y-1">
              {card.sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-primary dark:text-brand-light-blue hover:underline"
                  >
                    {s.label}
                    <ExternalLinkIcon />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ── category section ──────────────────────────────────────────────────────────

function CategorySection({ category }: { category: RightsCategory }) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-lg bg-brand-light-blue/30 dark:bg-brand-primary/20 flex items-center justify-center text-brand-primary dark:text-brand-light-blue shrink-0">
          {category.icon}
        </span>
        <h3 className="text-lg font-semibold text-brand-navy dark:text-brand-off-white">
          {category.label}
        </h3>
      </div>
      <div className="space-y-2 ml-10">
        {category.cards.map((card) => (
          <RightsAccordion key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

// ── local rights ──────────────────────────────────────────────────────────────

function LocalRightsPanel() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray p-5">
        <div className="flex items-center gap-2 mb-3">
          <MapPinIcon />
          <h3 className="font-semibold text-brand-navy dark:text-brand-off-white">Local Rights Vary by City and County</h3>
        </div>
        <p className="text-sm text-brand-navy/65 dark:text-brand-off-white/55 leading-relaxed">
          Cities and counties in Washington can enact protections that go beyond state law — including higher minimum wages,
          stronger tenant protections, and stricter limits on police conduct. Seattle, Tacoma, Bellevue, and other jurisdictions
          have their own rules that may apply to you. Always check your local ordinances.
        </p>
        <div className="mt-4">
          <Link
            href="/directory?category=law-enforcement"
            className="inline-flex items-center gap-1.5 text-sm text-brand-primary dark:text-brand-red font-medium hover:underline"
          >
            View local law enforcement agencies in the Directory
            <ExternalLinkIcon />
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray p-5">
        <h3 className="font-semibold text-brand-navy dark:text-brand-off-white mb-3">Sanctuary Jurisdictions in Washington</h3>
        <p className="text-sm text-brand-navy/65 dark:text-brand-off-white/55 leading-relaxed mb-4">
          The following Washington jurisdictions have policies limiting local law enforcement cooperation with federal
          immigration enforcement (ICE detainer requests). This does not prevent federal immigration enforcement —
          it means local agencies will not detain individuals solely on ICE detainer requests without judicial warrants.
        </p>
        <div className="flex flex-wrap gap-2">
          {WA_SANCTUARY_CITIES.map((city) => (
            <span
              key={city}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-brand-light-blue/25 dark:bg-brand-primary/15 text-brand-primary dark:text-brand-light-blue border border-brand-light-blue/50 dark:border-brand-primary/25"
            >
              {city}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-brand-navy/45 dark:text-brand-off-white/35">
          Source:{" "}
          <a
            href="https://www.ilrc.org/local-enforcement-guide"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-brand-primary dark:hover:text-brand-red"
          >
            Immigrant Legal Resource Center — Local Enforcement Guide
          </a>
        </p>
      </div>

      <div className="rounded-xl border border-brand-light-gray/70 dark:border-brand-dark-gray bg-white dark:bg-brand-dark-gray p-5">
        <h3 className="font-semibold text-brand-navy dark:text-brand-off-white mb-3">Notable Local Protections</h3>
        <ul className="space-y-3 text-sm">
          {[
            {
              place: "Seattle",
              rule: "Minimum wage of $20.76/hr (2025) for large employers. Strong Just Cause Eviction ordinance (SMC 22.206). Protections for gig economy workers.",
              url: "https://seattle.gov/laborstandards",
            },
            {
              place: "King County",
              rule: "King County limits cooperation with ICE detainer requests. County has its own Fair Housing enforcement.",
              url: "https://kingcounty.gov/en/dept/dajd/justice-programs/office-of-law-enforcement-oversight.html",
            },
            {
              place: "Tacoma",
              rule: "Tacoma has a tenant protection ordinance requiring 90-day notice before rent increases.",
              url: "https://cityoftacoma.org/government/city_departments/neighborhood_and_community_services/housing",
            },
            {
              place: "Bellingham",
              rule: "Bellingham has adopted tenant relocation assistance requirements.",
              url: "https://cob.org/services/housing",
            },
          ].map(({ place, rule, url }) => (
            <li key={place} className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 px-2 py-0.5 text-xs font-semibold rounded bg-brand-light-gray/50 dark:bg-brand-dark-gray text-brand-navy/60 dark:text-brand-off-white/50">
                {place}
              </span>
              <span className="text-brand-navy/70 dark:text-brand-off-white/60 leading-relaxed">
                {rule}{" "}
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-primary dark:text-brand-red hover:underline inline-flex items-center gap-0.5">
                  Learn more <ExternalLinkIcon />
                </a>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── main browser component ────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "federal", label: "Federal Rights" },
  { id: "state", label: "Washington State Rights" },
  { id: "local", label: "Local Rights" },
];

export function RightsBrowser() {
  const [activeTab, setActiveTab] = useState<Tab>("federal");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-8 p-1 rounded-lg bg-brand-light-gray/30 dark:bg-brand-dark-gray/50 w-fit">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-white dark:bg-brand-charcoal text-brand-navy dark:text-brand-off-white shadow-sm"
                : "text-brand-navy/55 dark:text-brand-off-white/50 hover:text-brand-navy/80 dark:hover:text-brand-off-white/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Federal */}
      {activeTab === "federal" && (
        <div className="space-y-10">
          {FEDERAL_CATEGORIES.map((cat) => (
            <CategorySection key={cat.id} category={cat} />
          ))}
        </div>
      )}

      {/* State */}
      {activeTab === "state" && (
        <div className="space-y-10">
          {STATE_CATEGORIES.map((cat) => (
            <CategorySection key={cat.id} category={cat} />
          ))}
        </div>
      )}

      {/* Local */}
      {activeTab === "local" && <LocalRightsPanel />}
    </div>
  );
}
