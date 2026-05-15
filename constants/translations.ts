/**
 * KAIRO — Localization Dictionary
 * ─────────────────────────────────────────────
 * Mappings for English and Nigerian Pidgin.
 */

export const TRANSLATIONS = {
  en: {
    // Home
    greeting: "Good day,",
    trust_card_title: "Economic Identity",
    trust_points: "Trust Points",
    wallet_balance: "Wallet Balance",
    market_pulse: "Market Pulse",
    quick_actions: "Quick Actions",
    find_gigs: "Find Gigs",
    send_money: "Send Money",
    my_insights: "My Insights",
    micro_loan: "Micro-Loan",
    boost_trust: "Boost your Trust",
    boost_desc: "Link your work samples to unlock premium gig opportunities.",
    link_portfolio: "Link Portfolio",

    // Gigs
    gigs_title: "Opportunities",
    search_placeholder: "Search gigs (e.g. Driver)",
    qualified: "Qualified",
    unlocked: "Unlocked",
    view_details: "View Details",

    // Trust
    trust_score: "Trust Score",
    trust_history: "Score History",
    how_it_works: "How it works",

    // Profile
    edit_profile: "Edit Profile",
    save: "Save",
    language: "Language",
    logout: "Logout",
    ai_coach: "Hustle Insight",
    insight_bvn: "Your score is stuck! Verify your BVN sharply make your level change.",
    insight_loan: "You dey close! Link one more work sample to unlock your ₦50k loan.",
    insight_skills: "Demand for your skills high today. Update your portfolio to get more gigs.",
    insight_btn: "Level Up Now",
  },
  pidgin: {
    // Home
    greeting: "How far,",
    trust_card_title: "How You Be",
    trust_points: "Trust Points",
    wallet_balance: "Your Money",
    market_pulse: "Wetin Dey Sup",
    quick_actions: "Fast Move",
    find_gigs: "Find Work",
    send_money: "Send Cash",
    my_insights: "My Levels",
    micro_loan: "Small Loan",
    boost_trust: "Carry Your Level Up",
    boost_desc: "Put your work sample so you go fit see big big work.",
    link_portfolio: "Link Portfolio",

    // Gigs
    gigs_title: "Better Work",
    search_placeholder: "Find work (e.g. Driver)",
    qualified: "You Qualify",
    unlocked: "Done Open",
    view_details: "Check Am",

    // Trust
    trust_score: "Your Level",
    trust_history: "How You Move",
    how_it_works: "How e be",

    // Profile
    edit_profile: "Change Level",
    save: "Keep Am",
    language: "Talk Mode",
    logout: "Comot",
    ai_coach: "Hustle Insight",
    insight_bvn: "Your score don hang! Verify your BVN sharply make your level change.",
    insight_loan: "You dey close! Link one more work sample to unlock your ₦50k loan.",
    insight_skills: "Demand for your skills high today. Update your portfolio to get more gigs.",
    insight_btn: "Level Up Now",
  }
};

export type TranslationKey = keyof typeof TRANSLATIONS.en;
