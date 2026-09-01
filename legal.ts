export interface LegalDoc {
  kicker: string;
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
}

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  terms: {
    kicker: "Agreement",
    title: "Terms of Service",
    updated: "Version 1 MVP",
    sections: [
      {
        heading: "Who can use VibeTalk",
        body: "VibeTalk is for adults aged 18 and over (or the age of majority where you live). At signup you confirm your date of birth and that you are of legal age. We may add formal age verification in a future release; until then, we rely on your honesty and on community reports.",
      },
      {
        heading: "The prototype you are using now",
        body: "Version 1 is a functional prototype. Accounts, messages, rooms, coins and gifts are stored in your own browser using localStorage. There is no server, no real-time audio, and no cross-device sync. Clearing your browser data permanently deletes this account, so please don't write anything you'd be upset to lose.",
      },
      {
        heading: "Conduct in voice rooms",
        body: "You agree not to harass, threaten, defame or dox another member; not to post hate speech; not to share sexual content involving anyone under 18; and not to solicit money, financial details, gambling or illegal services. Rooms may be muted, closed or removed at any time.",
      },
      {
        heading: "Virtual items have no cash value",
        body: "Vibe Coins, gifts and points are internal, non-transferable credits for this prototype. They cannot be exchanged for money or goods, are not refunds, and carry no warranty of continued availability. Real payment providers are not integrated in version 1 and no purchase is ever charged.",
      },
      {
        heading: "Game rewards",
        body: "Casual games award demo points only. VibeTalk is not a gambling product: nothing can be wagered, nothing can be won that has monetary value, and minors are excluded from the platform entirely.",
      },
      {
        heading: "Reporting, blocking and removal",
        body: "You can report any member or room. In this MVP reports stay on your device; in version 2 they are delivered to a moderation team that can warn, mute, suspend or remove accounts. Repeated abuse of the report system is itself a violation.",
      },
      {
        heading: "Changes to these terms",
        body: "We will update these terms as features (real audio, payments, moderation queues) ship. Material changes will be announced in-app before they apply to your account.",
      },
    ],
  },
  privacy: {
    kicker: "Your data",
    title: "Privacy Policy",
    updated: "Version 1 MVP",
    sections: [
      {
        heading: "What is collected",
        body: "Everything you enter — username, email, password, date of birth, gender, country, language, bio, interests, messages, coins and gifts — is written to localStorage under the keys vibetalk.db.v1 and vibetalk.session.v1 in your browser. Nothing is transmitted, logged or sold.",
      },
      {
        heading: "What is never collected",
        body: "This MVP requests no microphone, camera, contacts, location or advertising-identifier permission. It contains no analytics SDK, no tracking pixels, no third-party login and no payment SDK.",
      },
      {
        heading: "Why we still ask your age",
        body: "Age gating keeps an adults-only space adults-only. Your date of birth stays on your device in version 1; it is only used to compute whether you are 18 or over.",
      },
      {
        heading: "Deletion",
        body: "You can wipe everything at any time from Settings → Danger zone → Reset all demo data, or by clearing site data for this origin. Because there is no server, deleting your local data deletes your only copy of the account.",
      },
      {
        heading: "What changes in version 2",
        body: "Moving to a real backend (for example Firebase Auth plus Firestore) means your account, messages and room state live on servers, are backed up, and are subject to retention and moderation policies we will document here at that time. Real-time voice (Agora or ZEGOCLOUD) adds transient audio streams which we intend to process without recording.",
      },
      {
        heading: "Contact",
        body: "For privacy questions about the prototype, use the in-app report flow with the reason 'Privacy concern' so the ticket is attached to your local data for review.",
      },
    ],
  },
  guidelines: {
    kicker: "House rules",
    title: "Community Guidelines",
    updated: "Version 1 MVP",
    sections: [
      {
        heading: "Be an adult about it",
        body: "Assume everyone is listening. Disagreement is fine; contempt is not. If a conversation heats up, take a breath, use the raise-hand feature, or leave the room — no one is entitled to your energy.",
      },
      {
        heading: "Zero tolerance",
        body: "Racism, sexism, homophobia, transphobia, ableism, threats, doxxing, non-consensual intimate imagery, and any sexual content involving minors result in immediate removal. We also remove grooming, sextortion, human-trafficking references and illegal commerce.",
      },
      {
        heading: "No financial pressure",
        body: "Never ask for money, gift cards, bank details, crypto or 'loans'. Do not present gifting as an expectation for attention, and never run games of chance for money in a room.",
      },
      {
        heading: "Keep rooms welcoming",
        body: "Hosts set the topic and the tone. State your rules in the room description, give newcomers a seat, don't hog the mic, and moderate your own stage — we will support you with tools in v2.",
      },
      {
        heading: "No spam, no funnels",
        body: "One promotional mention per room if it's relevant and invited. Repeated DM blasts, affiliate funnels, invite-farming schemes and fake engagement are removed.",
      },
      {
        heading: "Use the report button",
        body: "Reporting is not escalation, it's housekeeping. Every report helps. If you see someone in danger, also contact local emergency services — this prototype is monitored by no one until the moderation queue arrives.",
      },
    ],
  },
};
