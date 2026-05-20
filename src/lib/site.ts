// Single source of truth for site content, extracted from blancnailslounge.com.
// Keeping content here (not hardcoded in components) makes it reusable across pages
// and trivial to swap for a CMS later.

export const site = {
  name: "BLANC NAILS LOUNGE",
  tagline: "experience the higher standard",
  booking: "https://abcapp.us/feedback/appointment?appid=uQXqGNI",
  instagram: "https://www.instagram.com/blanc_nails_lounge",
  contact: {
    email: "blancnailslounge@gmail.com",
    phone: "(803) 667-5606",
    phoneHref: "tel:+18036675606",
    address: { line1: "185 Earth Rd, Ste A", line2: "Columbia, SC 29045" },
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/about" },
    { label: "Appointments", href: "/appointments" },
    { label: "Contact", href: "/contact" },
  ],
  services: [
    {
      title: "Precision Care",
      body: "Experience the epitome of nail perfection with our top-tier equipment and unmatched skill, ensuring flawless results every time.",
    },
    {
      title: "Color Command",
      body: "Unleash bold finishes with our dynamic range of polishes. Elevate your nails to new heights with colors that demand attention and deliver unstoppable confidence.",
    },
    {
      title: "Precision Nails",
      body: "Experience the ultimate in nail care with our expert manicures and pedicures, designed for flawless results and unmatched quality. Our skilled technicians are committed to delivering excellence, ensuring your nails look stunning and healthy every time.",
    },
  ],
  story:
    "Unleash the power of impeccable nail care with our exceptional manicures and pedicures that drive results swiftly and flawlessly. Step into a realm where precision meets luxury and elevate your grooming game with our unparalleled services.",

  // Page intros (extracted verbatim from each route)
  servicesIntro:
    "Command your schedule with a click and take charge of your transformative beauty experience. Book your manicure and pedicure appointment now to achieve impeccable style swiftly and confidently.",
  appointmentsIntro:
    "Transform your nails with a precision manicure or pedicure that exudes elegance and style. Book your appointment today and step into a world of ultimate pampering and sophistication.",
  contactIntro:
    "Ready to join forces? Give us your details and we'll connect with you in no time. We're eager to hear from you!",

  about: {
    heading: "Who We Are",
    body: "Katie and Philip are a couple who share a passion for beauty and entrepreneurship. Philip came from a Software Management background, and Katie has been an esthetician. Combining their talents, they opened BLANC NAILS LOUNGE, an elegant sanctuary in the city known for its exquisite nail artistry and serene ambiance. Katie, the creative force, transformed every nail into a tiny masterpiece, while Philip's savvy business skills ensured the salon ran smoothly and clients felt pampered. Their shared vision and dedication quickly turned BLANC NAILS LOUNGE into a beloved hotspot, celebrated for its impeccable service and the warmth of its two young owners.",
  },

  // Priced menu re-segmented from the /services page (see note: category grouping inferred)
  serviceMenu: [
    {
      category: "Pedicures",
      items: [
        { name: "Blanc Secret Pedicure", price: "$67 / Gel $82" },
        { name: "Top Notch Therapy Pedicure", price: "$76 / Gel $91" },
        { name: "Pamper Me Pedicure", price: "$56 / Gel $71" },
        { name: "Treat Yourself Pedicure", price: "$46 / Gel $61" },
        { name: "Express Pedicure", price: "$39 / Gel $54" },
        { name: "Full Set on Toes", price: "$65" },
        { name: "Fill In on Toes", price: "$50" },
        { name: "Acrylic Two Big Toes / each", price: "$15 / $8" },
        { name: "Acrylic Fill In Two Big Toes / each", price: "$10 / $5" },
        { name: "Paraffin Wax", price: "$10" },
        { name: "Hot Stone Massage", price: "$10" },
        { name: "Gel Polish Removal (no redo)", price: "$5" },
      ],
    },
    {
      category: "Waxing / Lashes",
      items: [
        { name: "Eyebrows", price: "$12+" },
        { name: "Lip", price: "$8+" },
        { name: "Chin", price: "$15+" },
        { name: "Sideburns", price: "$20+" },
        { name: "Whole Face", price: "$20+" },
        { name: "Eyebrow Tint", price: "$35" },
        { name: "Clusters", price: "$40+" },
        { name: "Mink Cluster", price: "$60+" },
      ],
    },
    {
      category: "Precision Nails",
      items: [
        { name: "Acrylic Full Set", price: "$52+" },
        { name: "Acrylic Fill In", price: "$45+" },
        { name: "Ombré Full Set", price: "$60+" },
        { name: "Gel X Full Set", price: "$65+" },
        { name: "Gel X Fill In", price: "$50+" },
        { name: "Builder / Liquid Gel Full Set", price: "$60+" },
        { name: "Builder / Liquid Gel Fill In", price: "$50+" },
        { name: "Tap / Poly Gel Full Set", price: "$60+" },
        { name: "Tap / Poly Gel Fill In", price: "$50+" },
        { name: "Dipping Powder", price: "$50+" },
        { name: "Classic Manicure", price: "$30 / Gel $40" },
        { name: "Blanc Deluxe Manicure", price: "$42 / Gel $52" },
        { name: "French Tip", price: "$7+" },
        { name: "Ombré", price: "$10+" },
        { name: "Add Tip On", price: "$5+" },
        { name: "Cuticle Clean", price: "$5+" },
        { name: "Nail Repair", price: "$7+" },
        { name: "Regular Polish Change", price: "$18" },
        { name: "Gel Polish Change", price: "$30" },
        { name: "Gel Polish Take Off", price: "$10+" },
        { name: "Dip Powder Take Off", price: "$15+" },
        { name: "Acrylic Take Off", price: "$15+" },
        { name: "Finger / Toe Nail Trim", price: "$10 / $15" },
      ],
    },
    {
      category: "Kids",
      items: [
        { name: "Pedicure", price: "$26 / Gel $40" },
        { name: "Manicure", price: "$15 / Gel $25" },
        { name: "Nails / Toes Regular Polish Change", price: "$10" },
        { name: "Nails / Toes Gel Polish Change", price: "$15" },
      ],
    },
  ],
} as const;
