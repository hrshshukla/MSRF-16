import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";

export type Language = "en" | "hi" | "mr";

const LANGUAGE_STORAGE_KEY = "mahakal-language";

export function formatRelativeTime(date: Date, language: Language): string {
  if (language === "en") {
    return `${formatDistanceToNow(date)} ago`;
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const minutes = Math.floor(elapsedSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (language === "hi") {
    if (minutes < 1) return "एक मिनट से कम पहले";
    if (minutes < 60) return `${minutes} मिनट पहले`;
    if (hours < 24) return hours === 1 ? "लगभग 1 घंटे पहले" : `${hours} घंटे पहले`;
    if (days < 30) return days === 1 ? "1 दिन पहले" : `${days} दिन पहले`;
    if (months < 12) return months === 1 ? "लगभग 1 महीने पहले" : `${months} महीने पहले`;
    return years === 1 ? "लगभग 1 साल पहले" : `${years} साल पहले`;
  }

  if (minutes < 1) return "एका मिनिटापेक्षा कमी आधी";
  if (minutes < 60) return `${minutes} मिनिटांपूर्वी`;
  if (hours < 24) return hours === 1 ? "सुमारे 1 तासापूर्वी" : `${hours} तासांपूर्वी`;
  if (days < 30) return days === 1 ? "1 दिवसापूर्वी" : `${days} दिवसांपूर्वी`;
  if (months < 12) return months === 1 ? "सुमारे 1 महिन्यापूर्वी" : `${months} महिन्यांपूर्वी`;
  return years === 1 ? "सुमारे 1 वर्षापूर्वी" : `${years} वर्षांपूर्वी`;
}

const translations: Record<Exclude<Language, "en">, Record<string, string>> = {
  hi: {
    Language: "भाषा",
    Home: "होम",
    Post: "पोस्ट",
    Seva: "सेवा",
    Members: "सदस्य",
    Contact: "संपर्क",
    Settings: "सेटिंग्स",
    "Log out": "लॉग आउट",
    "Login in": "लॉग इन",
    Create: "खाता बनाएं",
    Appearance: "रूप-रंग",
    "Go to home": "होम पर जाएं",
    "View all posts": "सभी पोस्ट देखें",
    "View seva campaigns, projects, and events": "सेवा अभियान, परियोजनाएं और कार्यक्रम देखें",
    "Open profile menu": "प्रोफ़ाइल मेनू खोलें",
    "Switch to light mode": "लाइट मोड पर जाएं",
    "Switch to dark mode": "डार्क मोड पर जाएं",
    "Our work": "हमारा कार्य",
    Campaigns: "अभियान",
    Projects: "परियोजनाएं",
    Events: "कार्यक्रम",
    "Our Members": "हमारे सदस्य",
    "The people behind the seva": "सेवा के पीछे समर्पित लोग",
    "Meet the dedicated members serving Sanatan Dharma and strengthening communities through meaningful action.":
      "सनातन धर्म की सेवा और सार्थक कार्यों से समुदायों को मजबूत करने वाले समर्पित सदस्यों से मिलें।",
    "Seva Donation": "सेवा दान",
    "Make every offering count": "हर अर्पण को सार्थक बनाएं",
    "Support a seva initiative and help turn compassion into direct, meaningful action.":
      "सेवा पहल का समर्थन करें और करुणा को प्रत्यक्ष, सार्थक कार्य में बदलने में मदद करें।",
    "See all campaigns": "सभी अभियान देखें",
    Paused: "रुका हुआ",
    Completed: "पूरा हुआ",
    Ongoing: "जारी",
    "raised of": "में से जुटाए गए",
    "Donate Now": "अभी दान करें",
    "Top donors": "शीर्ष दानदाता",
    "Be the first donor to support this seva.": "इस सेवा का समर्थन करने वाले पहले दानदाता बनें।",
    "See details": "विवरण देखें",
    "Our Projects": "हमारी परियोजनाएं",
    "Seva that creates lasting change": "ऐसी सेवा जो स्थायी बदलाव लाए",
    "From daily care to lifelong opportunity, every project turns compassion into meaningful action.":
      "दैनिक देखभाल से लेकर जीवनभर के अवसरों तक, हर परियोजना करुणा को सार्थक कार्य में बदलती है।",
    "Explore project": "परियोजना देखें",
    "A Legacy of Service": "सेवा की विरासत",
    "We believe that true dharma is realized through selfless action. Explore our initiatives.":
      "हम मानते हैं कि सच्चा धर्म निःस्वार्थ कर्म से साकार होता है। हमारी पहलों को देखें।",
    "View Projects": "परियोजनाएं देखें",
    "Upcoming Events": "आगामी कार्यक्रम",
    "Preserving Sanatan Heritage": "सनातन विरासत का संरक्षण",
    "Empowering communities through ": "धर्म और सेवा के माध्यम से ",
    " and ": " के जरिए ",
    "Mahakal Sanatan Raksha Foundation runs active campaigns, dharmic events, and community projects to strengthen cultural roots and serve those in need.":
      "महाकाल सनातन रक्षा फाउंडेशन सांस्कृतिक जड़ों को मजबूत करने और जरूरतमंदों की सेवा के लिए सक्रिय अभियान, धार्मिक कार्यक्रम और सामुदायिक परियोजनाएं चलाता है।",
    "Support Our Campaigns": "हमारे अभियानों का समर्थन करें",
    "Join as Volunteer": "स्वयंसेवक के रूप में जुड़ें",
    "Active Members": "सक्रिय सदस्य",
    "People Served": "सेवा प्राप्त लोग",
    "States Reached": "पहुंचे हुए राज्य",
    "Funded for Seva": "सेवा के लिए जुटाई गई राशि",
    "Member profiles are temporarily unavailable": "सदस्य प्रोफ़ाइल अभी उपलब्ध नहीं हैं",
    "Please check back soon to meet our team.": "हमारी टीम से मिलने के लिए कृपया जल्द फिर आएं।",
    "Our member profiles are coming soon": "हमारे सदस्य प्रोफ़ाइल जल्द आ रहे हैं",
    "We are preparing the stories of the people who serve our community.":
      "हम अपने समुदाय की सेवा करने वाले लोगों की कहानियां तैयार कर रहे हैं।",
    "See all members": "सभी सदस्य देखें",
    "Protecting and caring for sacred cows through daily seva and shelter support.":
      "दैनिक सेवा और आश्रय सहायता के माध्यम से पवित्र गायों की रक्षा और देखभाल करना।",
    "Passing on dharmic values, stories, and traditions to the next generation.":
      "धार्मिक मूल्यों, कथाओं और परंपराओं को अगली पीढ़ी तक पहुंचाना।",
    "Building cleaner temples, neighborhoods, and public spaces through collective action.":
      "सामूहिक प्रयासों से स्वच्छ मंदिर, मोहल्ले और सार्वजनिक स्थान बनाना।",
    "Serving nourishing meals to families, pilgrims, and communities in need.":
      "परिवारों, तीर्थयात्रियों और जरूरतमंद समुदायों को पौष्टिक भोजन देना।",
    "Foundation Projects": "फाउंडेशन परियोजनाएं",
    "Long-term initiatives dedicated to structural rebuilding, education, and sustained community welfare.":
      "संरचनात्मक पुनर्निर्माण, शिक्षा और निरंतर सामुदायिक कल्याण के लिए समर्पित दीर्घकालिक पहल।",
    "No projects found": "कोई परियोजना नहीं मिली",
    "There are currently no projects listed.": "वर्तमान में कोई परियोजना सूचीबद्ध नहीं है।",
    "Dharmic Events": "धार्मिक कार्यक्रम",
    "Gatherings, pujas, cultural festivals, and community learning sessions to celebrate and learn our shared heritage.":
      "हमारी साझा विरासत का उत्सव मनाने और उसे समझने के लिए सभाएं, पूजा, सांस्कृतिक उत्सव और सामुदायिक शिक्षण सत्र।",
    "No upcoming events": "कोई आगामी कार्यक्रम नहीं है",
    "Check back later for new event announcements.": "नए कार्यक्रमों की घोषणाओं के लिए बाद में फिर आएं।",
    "Attending": "उपस्थित",
    "Event Details": "कार्यक्रम विवरण",
    "Support this seva": "इस सेवा का समर्थन करें",
    "Campaign Not Found": "अभियान नहीं मिला",
    "Back to Campaigns": "अभियानों पर वापस जाएं",
    "About this Campaign": "इस अभियान के बारे में",
    Started: "शुरू हुआ",
    Ends: "समाप्त",
    "Back to Events": "कार्यक्रमों पर वापस जाएं",
    "Seva Campaigns": "सेवा अभियान",
    "Join us in our ongoing efforts to support communities, build infrastructure, and provide emergency relief across the nation.":
      "समुदायों का समर्थन करने, बुनियादी ढांचा बनाने और पूरे देश में आपातकालीन राहत देने के हमारे निरंतर प्रयासों में शामिल हों।",
    "No active campaigns": "कोई सक्रिय अभियान नहीं है",
    "There are currently no active campaigns. Please check back later.":
      "वर्तमान में कोई सक्रिय अभियान नहीं है। कृपया बाद में फिर आएं।",
    "Protecting the Roots of Dharma": "धर्म की जड़ों की रक्षा",
    "Our Core Pillars": "हमारे मूल स्तंभ",
    "The foundation operates on four essential pillars that guide every initiative and campaign we undertake.":
      "फाउंडेशन चार महत्वपूर्ण स्तंभों पर काम करता है, जो हमारी हर पहल और अभियान का मार्गदर्शन करते हैं।",
    "Our Journey": "हमारी यात्रा",
    "Contact Us": "हमसे संपर्क करें",
    "Have a question, suggestion, or want to collaborate? Reach out to us. We are always eager to connect with like-minded individuals.":
      "कोई प्रश्न, सुझाव है या सहयोग करना चाहते हैं? हमसे संपर्क करें। हम समान विचारधारा वाले लोगों से जुड़ने के लिए हमेशा उत्सुक हैं।",
    "Get in Touch": "संपर्क करें",
    Headquarters: "मुख्यालय",
    Phone: "फोन",
    Email: "ईमेल",
    "Office Hours": "कार्यालय समय",
    "Send a Message": "संदेश भेजें",
    "Full Name": "पूरा नाम",
    "Email Address": "ईमेल पता",
    "Phone Number (Optional)": "फोन नंबर (वैकल्पिक)",
    Subject: "विषय",
    Message: "संदेश",
    "Send Message": "संदेश भेजें",
    "Sending...": "भेजा जा रहा है...",
    Gallery: "गैलरी",
    "Moments of devotion, service, and community gathered from across our initiatives.":
      "हमारी विभिन्न पहलों से जुड़े भक्ति, सेवा और समुदाय के यादगार पल।",
    "No images found": "कोई चित्र नहीं मिला",
    "Become a Volunteer": "स्वयंसेवक बनें",
    "Dedicate your time, skills, and energy to the service of Sanatan Dharma.":
      "अपना समय, कौशल और ऊर्जा सनातन धर्म की सेवा के लिए समर्पित करें।",
    "Applications Open": "आवेदन खुले हैं",
    "Community Events": "सामुदायिक कार्यक्रम",
    "Seva Operations": "सेवा संचालन",
    "Apply as Volunteer": "स्वयंसेवक के रूप में आवेदन करें",
    "Want to help right now?": "अभी सहायता करना चाहते हैं?",
    "Contact Us Direct": "सीधे हमसे संपर्क करें",
    Organization: "संगठन",
    "About Us": "हमारे बारे में",
    "Get Involved": "साथ जुड़ें",
    Media: "मीडिया",
    "Photo Gallery": "फोटो गैलरी",
    Blog: "ब्लॉग",
    Help: "सहायता",
    "Made with": "बनाया गया",
    "for Dharma.": "धर्म के लिए।",
    "My account": "मेरा खाता",
    "Back to settings": "सेटिंग्स पर वापस जाएं",
    "Edit profile": "प्रोफ़ाइल संपादित करें",
    "Your posts": "आपकी पोस्ट",
    "Update password": "पासवर्ड अपडेट करें",
    "ID card": "आईडी कार्ड",
    "Manage campaigns": "अभियान प्रबंधित करें",
    "Manage accounts": "खाते प्रबंधित करें",
    "Manage members": "सदस्य प्रबंधित करें",
    "Member overview": "सदस्य अवलोकन",
    "Total donated": "कुल दान",
    "Donation records": "दान रिकॉर्ड",
    "Events participated": "भाग लिए गए कार्यक्रम",
    "Community posts": "सामुदायिक पोस्ट",
    "Where you donated": "जहां आपने दान किया",
    "Your recorded contribution history.": "आपके दर्ज योगदान का इतिहास।",
    "No donation records are linked to your account yet.": "अभी तक आपके खाते से कोई दान रिकॉर्ड जुड़ा नहीं है।",
    "Where you participated": "जहां आपने भाग लिया",
    "Your recorded event participation.": "आपकी दर्ज कार्यक्रम भागीदारी।",
    "No event participation records are linked to your account yet.": "अभी तक आपके खाते से कोई कार्यक्रम भागीदारी रिकॉर्ड जुड़ा नहीं है।",
    "Profile not found": "प्रोफ़ाइल नहीं मिली",
    "Profile updated successfully.": "प्रोफ़ाइल सफलतापूर्वक अपडेट हुई।",
    "Personal details": "व्यक्तिगत विवरण",
    "Super user": "सुपर यूज़र",
    "Founder" : "संस्थापक",
    "Co-founder" : "सह-संस्थापक",
    "Admin": "एडमिन",
    "Member": "सदस्य",
    "Profile photo": "प्रोफ़ाइल फोटो",
    "JPG, PNG, GIF, or WebP · 2 MB max": "JPG, PNG, GIF या WebP · अधिकतम 2 MB",
    "Uploading…": "अपलोड हो रहा है…",
    "Choose photo": "फोटो चुनें",
    "Remove": "हटाएं",
    "Profile preview": "प्रोफ़ाइल पूर्वावलोकन",
    "Full name": "पूरा नाम",
    "Email address": "ईमेल पता",
    "Phone number ": "फोन नंबर ",
    "My thoughts": "मेरे विचार",
    "This default thought will appear until you write your own.": "जब तक आप अपना विचार नहीं लिखते, यह डिफ़ॉल्ट विचार दिखाई देगा।",
    "Share a thought about yourself or your seva...": "अपने बारे में या अपनी सेवा के बारे में कुछ लिखें...",
    "(optional)": "(वैकल्पिक)",
    Cancel: "रद्द करें",
    "Saving…": "सेव हो रहा है…",
    Saved: "सहेजा गया",
    "Save changes": "परिवर्तन सेव करें",
    "Please choose an image file.": "कृपया एक चित्र फ़ाइल चुनें।",
    "Profile photos must be 2 MB or smaller.": "प्रोफ़ाइल फोटो 2 MB या उससे छोटी होनी चाहिए।",
    "You must be signed in to upload a profile photo.": "प्रोफ़ाइल फोटो अपलोड करने के लिए आपको साइन इन करना होगा।",
    "Photo upload failed. Please try again.": "फोटो अपलोड विफल हुआ। कृपया फिर प्रयास करें।",
    "Reset Password": "पासवर्ड रीसेट करें",
    Security: "सुरक्षा",
    "Use a strong password you do not use elsewhere.": "ऐसा मजबूत पासवर्ड इस्तेमाल करें जिसका उपयोग आप कहीं और न करते हों।",
    "Current password": "वर्तमान पासवर्ड",
    "New password": "नया पासवर्ड",
    "Confirm new password": "नया पासवर्ड दोहराएं",
    "Member Portal": "सदस्य पोर्टल",
    "Remember me": "मुझे याद रखें",
    "Create Your Account": "अपना खाता बनाएं",
    Password: "पासवर्ड",
    "Membership": "सदस्यता",
    "Your digital foundation identity card with a scannable member QR code.": "स्कैन किए जा सकने वाले सदस्य QR कोड वाला आपका डिजिटल फाउंडेशन पहचान पत्र।",
    "Member ID:": "सदस्य आईडी:",
    "Status:": "स्थिति:",
    "Scan to verify": "सत्यापित करने के लिए स्कैन करें",
    "Member verification QR": "सदस्य सत्यापन QR",
    "Could not load your posts.": "आपकी पोस्ट लोड नहीं हो सकीं।",
    "No posts yet": "अभी कोई पोस्ट नहीं है",
    "Loading campaign...": "अभियान लोड हो रहा है...",
    "Loading event...": "कार्यक्रम लोड हो रहा है...",
    "Loading article...": "लेख लोड हो रहा है...",
    "Event Not Found": "कार्यक्रम नहीं मिला",
    "Article Not Found": "लेख नहीं मिला",
    "About this Event": "इस कार्यक्रम के बारे में",
    Date: "तारीख",
    Time: "समय",
    Location: "स्थान",
    Attendees: "उपस्थित लोग",
    Upcoming: "आगामी",
    "Donation Progress": "दान प्रगति",
    "Donation appeal not found": "दान अपील नहीं मिली",
    "The seva donation you are looking for is unavailable.": "आप जिस सेवा दान को ढूंढ रहे हैं वह उपलब्ध नहीं है।",
    "About this seva": "इस सेवा के बारे में",
    "Together, we can serve with purpose": "साथ मिलकर हम उद्देश्यपूर्ण सेवा कर सकते हैं",
    "All donors": "सभी दानदाता",
    "Every contribution matters": "हर योगदान महत्वपूर्ण है",
    "Loading...": "लोड हो रहा है...",
    "Admin tools": "एडमिन टूल्स",
    "Manage existing campaigns": "मौजूदा अभियान प्रबंधित करें",
    "Edit campaign details, stop campaigns, or permanently delete them.": "अभियान का विवरण संपादित करें, अभियान रोकें या उन्हें स्थायी रूप से हटाएं।",
    "Edit campaign": "अभियान संपादित करें",
    "No campaigns have been created yet.": "अभी तक कोई अभियान नहीं बनाया गया है।",
    "Create your first campaign": "अपना पहला अभियान बनाएं",
    Stop: "रोकें",
    Resume: "फिर शुरू करें",
    "Delete permanently": "स्थायी रूप से हटाएं",
    "Manage campaign": "अभियान प्रबंधित करें",
    "Manage volunteer": "स्वयंसेवक प्रबंधित करें",
    "No applications yet": "अभी कोई आवेदन नहीं है",
    "Skills and experience": "कौशल और अनुभव",
    "Why they want to volunteer": "वे स्वयंसेवक क्यों बनना चाहते हैं",
    "Create new campaign": "नया अभियान बनाएं",
    "Set up a new seva campaign for members and donors.": "सदस्यों और दानदाताओं के लिए नया सेवा अभियान बनाएं।",
    "Campaign details": "अभियान विवरण",
    "Add the information that will appear on the campaign page.": "अभियान पेज पर दिखाई देने वाली जानकारी जोड़ें।",
    "Member accounts": "सदस्य खाते",
    "View and search members →": "सदस्य देखें और खोजें →",
    "Admin accounts": "एडमिन खाते",
    "View and manage admins →": "एडमिन देखें और प्रबंधित करें →",
    "Delete this account?": "यह खाता हटाएं?",
    "Campaign lifecycle": "अभियान जीवनचक्र",
    "Edit values": "मान संपादित करें",
    "Stop campaign": "अभियान रोकें",
    "Share your experience": "अपना अनुभव साझा करें",
    "Login in to post updates, photos, and connect with the community.": "अपडेट और फोटो पोस्ट करने तथा समुदाय से जुड़ने के लिए लॉग इन करें।",
    "Upload failed": "अपलोड विफल",
    Photo: "फोटो",
    Like: "पसंद",
    Comment: "टिप्पणी",
    Share: "साझा करें",
    "See less": "कम देखें",
    "See more": "और देखें",
    "Write a comment...": "टिप्पणी लिखें...",
    "Insert emoji": "इमोजी जोड़ें",
    "No comments yet. Be the first to reply!": "अभी कोई टिप्पणी नहीं है। जवाब देने वाले पहले व्यक्ति बनें!",
    "Loading more": "और लोड हो रहा है",
    "Refresh": "रिफ्रेश",
    "Refreshing...": "रिफ्रेश हो रहा है...",
    "Release to refresh": "रिफ्रेश करने के लिए छोड़ें",
    "Pull to refresh": "रिफ्रेश करने के लिए खींचें",
    "Could not load the feed. Please try again.": "फीड लोड नहीं हो सकी। कृपया फिर प्रयास करें।",
    Retry: "फिर प्रयास करें",
    "Welcome to the Feed": "फीड में आपका स्वागत है",
    "This is where members share their Seva experiences. Be the first to post an update!": "यहां सदस्य अपने सेवा अनुभव साझा करते हैं। अपडेट पोस्ट करने वाले पहले व्यक्ति बनें!",
    "Scroll for more": "और देखने के लिए स्क्रॉल करें",
    "You've reached the end of the feed": "आप फीड के अंत तक पहुंच गए हैं",
    "View and search members": "सदस्य देखें और खोजें",
  },
  mr: {
    Language: "भाषा",
    Home: "मुख्यपृष्ठ",
    Post: "पोस्ट",
    Seva: "सेवा",
    "Gau Seva": "गौ सेवा",
    "Food Distribution": "खाद्य वितरण",
    "Medical Camp": "वैद्यकीय शिबिर",
    Members: "सदस्य",
    Contact: "संपर्क",
    Settings: "सेटिंग्ज",
    "Log out": "लॉग आउट",
    "Login in": "लॉग इन",
    Create: "खाते तयार करा",
    Appearance: "दिसणे",
    "Go to home": "मुख्यपृष्ठावर जा",
    "View all posts": "सर्व पोस्ट पहा",
    "View seva campaigns, projects, and events": "सेवा मोहिमा, प्रकल्प आणि कार्यक्रम पहा",
    "Open profile menu": "प्रोफाइल मेनू उघडा",
    "Switch to light mode": "लाइट मोडवर जा",
    "Switch to dark mode": "डार्क मोडवर जा",
    "Our work": "आमचे कार्य",
    Campaigns: "मोहिमा",
    Projects: "प्रकल्प",
    Events: "कार्यक्रम",
    "Our Members": "आमचे सदस्य",
    "The people behind the seva": "सेवेच्या मागे असलेले समर्पित लोक",
    "Meet the dedicated members serving Sanatan Dharma and strengthening communities through meaningful action.":
      "सनातन धर्माची सेवा आणि अर्थपूर्ण कार्याद्वारे समुदाय मजबूत करणाऱ्या समर्पित सदस्यांना भेटा.",
    "Seva Donation": "सेवा देणगी",
    "Make every offering count": "प्रत्येक अर्पण अर्थपूर्ण बनवा",
    "Support a seva initiative and help turn compassion into direct, meaningful action.":
      "सेवा उपक्रमाला पाठिंबा द्या आणि करुणेचे प्रत्यक्ष, अर्थपूर्ण कृतीत रूपांतर करण्यास मदत करा.",
    "See all campaigns": "सर्व मोहिमा पहा",
    Paused: "थांबलेले",
    Completed: "पूर्ण",
    Upcoming: "आगामी",
    Ongoing: "सुरू",
    "raised of": "पैकी जमा",
    "Donate Now": "आत्ताच देणगी द्या",
    "Top donors": "शीर्ष देणगीदार",
    "Be the first donor to support this seva.": "या सेवेचा पाठिंबा देणारे पहिले देणगीदार बना.",
    "See details": "तपशील पहा",
    "Our Projects": "आमचे प्रकल्प",
    "Seva that creates lasting change": "चिरस्थायी बदल घडवणारी सेवा",
    "From daily care to lifelong opportunity, every project turns compassion into meaningful action.":
      "दैनंदिन काळजीपासून आयुष्यभराच्या संधीपर्यंत, प्रत्येक प्रकल्प करुणेचे अर्थपूर्ण कृतीत रूपांतर करतो.",
    "Explore project": "प्रकल्प पहा",
    "A Legacy of Service": "सेवेचा वारसा",
    "We believe that true dharma is realized through selfless action. Explore our initiatives.":
      "निःस्वार्थ कृतीतून खरा धर्म साकार होतो असा आमचा विश्वास आहे. आमचे उपक्रम पहा.",
    "View Projects": "प्रकल्प पहा",
    "Upcoming Events": "आगामी कार्यक्रम",
    "Preserving Sanatan Heritage": "सनातन वारशाचे जतन",
    "Empowering communities through ": "धर्म आणि सेवेच्या माध्यमातून ",
    " and ": " आणि ",
    "Mahakal Sanatan Raksha Foundation runs active campaigns, dharmic events, and community projects to strengthen cultural roots and serve those in need.":
      "महाकाल सनातन रक्षा फाउंडेशन सांस्कृतिक मुळे मजबूत करण्यासाठी आणि गरजूंची सेवा करण्यासाठी सक्रिय मोहिमा, धार्मिक कार्यक्रम आणि सामुदायिक प्रकल्प राबवते.",
    "Support Our Campaigns": "आमच्या मोहिमांना पाठिंबा द्या",
    "Join as Volunteer": "स्वयंसेवक म्हणून सामील व्हा",
    "Active Members": "सक्रिय सदस्य",
    "People Served": "सेवा मिळालेले लोक",
    "States Reached": "पोहोचलेली राज्ये",
    "Funded for Seva": "सेवेसाठी जमा निधी",
    "Member profiles are temporarily unavailable": "सदस्य प्रोफाइल सध्या उपलब्ध नाहीत",
    "Please check back soon to meet our team.": "आमच्या टीमला भेटण्यासाठी कृपया पुन्हा लवकर भेट द्या.",
    "Our member profiles are coming soon": "आमचे सदस्य प्रोफाइल लवकरच येत आहेत",
    "We are preparing the stories of the people who serve our community.":
      "आमच्या समुदायाची सेवा करणाऱ्या लोकांच्या कथा आम्ही तयार करत आहोत.",
    "See all members": "सर्व सदस्य पहा",
    "Protecting and caring for sacred cows through daily seva and shelter support.":
      "दैनंदिन सेवा आणि निवारा सहाय्याद्वारे पवित्र गायींचे संरक्षण व संगोपन करणे.",
    "Passing on dharmic values, stories, and traditions to the next generation.":
      "धार्मिक मूल्ये, कथा आणि परंपरा पुढील पिढीपर्यंत पोहोचवणे.",
    "Building cleaner temples, neighborhoods, and public spaces through collective action.":
      "सामूहिक प्रयत्नांतून स्वच्छ मंदिरे, परिसर आणि सार्वजनिक जागा तयार करणे.",
    "Serving nourishing meals to families, pilgrims, and communities in need.":
      "कुटुंबे, यात्रेकरू आणि गरजू समुदायांना पौष्टिक भोजन देणे.",
    "Foundation Projects": "फाउंडेशन प्रकल्प",
    "Long-term initiatives dedicated to structural rebuilding, education, and sustained community welfare.":
      "पुनर्बांधणी, शिक्षण आणि सातत्यपूर्ण सामुदायिक कल्याणासाठी समर्पित दीर्घकालीन उपक्रम.",
    "No projects found": "प्रकल्प सापडले नाहीत",
    "There are currently no projects listed.": "सध्या कोणतेही प्रकल्प सूचीबद्ध नाहीत.",
    "Dharmic Events": "धार्मिक कार्यक्रम",
    "Gatherings, pujas, cultural festivals, and community learning sessions to celebrate and learn our shared heritage.":
      "आपल्या सामायिक वारशाचा उत्सव साजरा करण्यासाठी आणि तो जाणून घेण्यासाठी सभा, पूजा, सांस्कृतिक उत्सव आणि सामुदायिक शिक्षण सत्रे.",
    "No upcoming events": "आगामी कार्यक्रम नाहीत",
    "Check back later for new event announcements.": "नवीन कार्यक्रमांच्या घोषणांसाठी नंतर पुन्हा भेट द्या.",
    "Attending": "उपस्थित",
    "Event Details": "कार्यक्रमाचा तपशील",
    "Support this seva": "या सेवेचा पाठिंबा द्या",
    "Campaign Not Found": "मोहीम सापडली नाही",
    "Back to Campaigns": "मोहिमांकडे परत जा",
    "About this Campaign": "या मोहिमेबद्दल",
    Started: "सुरू झाले",
    Ends: "समाप्त",
    "Back to Events": "कार्यक्रमांकडे परत जा",
    "Seva Campaigns": "सेवा मोहिमा",
    "Join us in our ongoing efforts to support communities, build infrastructure, and provide emergency relief across the nation.":
      "समुदायांना पाठिंबा देणे, पायाभूत सुविधा उभारणे आणि देशभर आपत्कालीन मदत देण्याच्या आमच्या प्रयत्नांत सहभागी व्हा.",
    "No active campaigns": "सक्रिय मोहिमा नाहीत",
    "There are currently no active campaigns. Please check back later.":
      "सध्या कोणत्याही सक्रिय मोहिमा नाहीत. कृपया नंतर पुन्हा भेट द्या.",
    "Protecting the Roots of Dharma": "धर्माच्या मुळांचे रक्षण",
    "Our Core Pillars": "आमचे मुख्य आधारस्तंभ",
    "The foundation operates on four essential pillars that guide every initiative and campaign we undertake.":
      "आम्ही राबविलेल्या प्रत्येक उपक्रमाला आणि मोहिमेला मार्गदर्शन करणाऱ्या चार महत्त्वाच्या आधारस्तंभांवर फाउंडेशन कार्य करते.",
    "Our Journey": "आमचा प्रवास",
    "Contact Us": "आमच्याशी संपर्क साधा",
    "Have a question, suggestion, or want to collaborate? Reach out to us. We are always eager to connect with like-minded individuals.":
      "प्रश्न किंवा सूचना आहेत का, किंवा सहकार्य करायचे आहे? आमच्याशी संपर्क साधा. समविचारी लोकांशी जोडण्यासाठी आम्ही नेहमी उत्सुक असतो.",
    "Get in Touch": "संपर्क साधा",
    Headquarters: "मुख्यालय",
    Phone: "फोन",
    Email: "ईमेल",
    "Office Hours": "कार्यालयीन वेळ",
    "Send a Message": "संदेश पाठवा",
    "Full Name": "पूर्ण नाव",
    "Email Address": "ईमेल पत्ता",
    "Phone Number (Optional)": "फोन नंबर (पर्यायी)",
    Subject: "विषय",
    Message: "संदेश",
    "Send Message": "संदेश पाठवा",
    "Sending...": "पाठवत आहे...",
    Gallery: "गॅलरी",
    "Moments of devotion, service, and community gathered from across our initiatives.":
      "आमच्या विविध उपक्रमांमधील भक्ती, सेवा आणि समुदायाचे क्षण.",
    "No images found": "चित्रे सापडली नाहीत",
    "Become a Volunteer": "स्वयंसेवक बना",
    "Dedicate your time, skills, and energy to the service of Sanatan Dharma.":
      "आपला वेळ, कौशल्य आणि ऊर्जा सनातन धर्माच्या सेवेसाठी समर्पित करा.",
    "Applications Open": "अर्ज खुले आहेत",
    "Community Events": "सामुदायिक कार्यक्रम",
    "Seva Operations": "सेवा कार्य",
    "Apply as Volunteer": "स्वयंसेवक म्हणून अर्ज करा",
    "Want to help right now?": "आत्ताच मदत करायची आहे का?",
    "Contact Us Direct": "थेट आमच्याशी संपर्क साधा",
    Organization: "संस्था",
    "About Us": "आमच्याबद्दल",
    "Get Involved": "सहभागी व्हा",
    Media: "मीडिया",
    "Photo Gallery": "फोटो गॅलरी",
    Blog: "ब्लॉग",
    Help: "मदत",
    "Made with": "बनवले",
    "for Dharma.": "धर्मासाठी.",
    "My account": "माझे खाते",
    "Back to settings": "सेटिंग्जवर परत जा",
    "Edit profile": "प्रोफाइल संपादित करा",
    "Your posts": "तुमच्या पोस्ट",
    "Update password": "पासवर्ड अपडेट करा",
    "ID card": "ओळखपत्र",
    "Manage volunteer": "स्वयंसेवक व्यवस्थापित करा",
    "Manage campaigns": "मोहिमा व्यवस्थापित करा",
    "Manage accounts": "खाती व्यवस्थापित करा",
    "Manage members": "सदस्य व्यवस्थापित करा",
    "Member overview": "सदस्य आढावा",
    "Total donated": "एकूण देणगी",
    "Donation records": "देणगी नोंदी",
    "Events participated": "सहभागी कार्यक्रम",
    "Community posts": "सामुदायिक पोस्ट",
    "Where you donated": "तुम्ही जिथे देणगी दिली",
    "Your recorded contribution history.": "तुमच्या नोंदवलेल्या योगदानाचा इतिहास.",
    "No donation records are linked to your account yet.": "तुमच्या खात्याशी अद्याप कोणत्याही देणगी नोंदी जोडलेल्या नाहीत.",
    "Where you participated": "तुम्ही जिथे सहभागी झाला",
    "Your recorded event participation.": "तुमचा नोंदवलेला कार्यक्रम सहभाग.",
    "No event participation records are linked to your account yet.": "तुमच्या खात्याशी अद्याप कोणत्याही कार्यक्रम सहभाग नोंदी जोडलेल्या नाहीत.",
    "Profile not found": "प्रोफाइल सापडले नाही",
    "Profile updated successfully.": "प्रोफाइल यशस्वीरित्या अपडेट झाले.",
    "Personal details": "वैयक्तिक तपशील",
    "Super user": "सुपर यूजर",
    Admin: "अॅडमिन",
    Member: "सदस्य",
    "Profile photo": "प्रोफाइल फोटो",
    "JPG, PNG, GIF, or WebP · 2 MB max": "JPG, PNG, GIF किंवा WebP · कमाल 2 MB",
    "Uploading…": "अपलोड होत आहे…",
    "Choose photo": "फोटो निवडा",
    Remove: "काढा",
    "Profile preview": "प्रोफाइल पूर्वावलोकन",
    "Full name": "पूर्ण नाव",
    "Email address": "ईमेल पत्ता",
    "Phone number ": "फोन नंबर ",
    "My thoughts": "माझे विचार",
    "This default thought will appear until you write your own.": "तुम्ही स्वतःचा विचार लिहीपर्यंत हा डीफॉल्ट विचार दिसेल.",
    "Share a thought about yourself or your seva...": "तुमच्याबद्दल किंवा तुमच्या सेवेबद्दल काही लिहा...",
    "(optional)": "(पर्यायी)",
    Cancel: "रद्द करा",
    "Saving…": "सेव्ह होत आहे…",
    Saved: "सेव्ह झाले",
    "Save changes": "बदल सेव्ह करा",
    "Please choose an image file.": "कृपया चित्र फाइल निवडा.",
    "Profile photos must be 2 MB or smaller.": "प्रोफाइल फोटो 2 MB किंवा त्यापेक्षा कमी असावा.",
    "You must be signed in to upload a profile photo.": "प्रोफाइल फोटो अपलोड करण्यासाठी तुम्ही साइन इन केलेले असणे आवश्यक आहे.",
    "Photo upload failed. Please try again.": "फोटो अपलोड अयशस्वी झाले. कृपया पुन्हा प्रयत्न करा.",
    "Reset Password": "पासवर्ड रीसेट करा",
    Security: "सुरक्षा",
    "Use a strong password you do not use elsewhere.": "तुम्ही इतरत्र वापरत नसलेला मजबूत पासवर्ड वापरा.",
    "Current password": "सध्याचा पासवर्ड",
    "New password": "नवीन पासवर्ड",
    "Confirm new password": "नवीन पासवर्डची पुष्टी करा",
    "Member Portal": "सदस्य पोर्टल",
    "Remember me": "मला लक्षात ठेवा",
    "Create Your Account": "तुमचे खाते तयार करा",
    Password: "पासवर्ड",
    Membership: "सदस्यत्व",
    "Your digital foundation identity card with a scannable member QR code.": "स्कॅन करता येणाऱ्या सदस्य QR कोडसह तुमचे डिजिटल फाउंडेशन ओळखपत्र.",
    "Member ID:": "सदस्य आयडी:",
    "Status:": "स्थिती:",
    "Scan to verify": "सत्यापित करण्यासाठी स्कॅन करा",
    "Member verification QR": "सदस्य सत्यापन QR",
    "Could not load your posts.": "तुमच्या पोस्ट लोड होऊ शकल्या नाहीत.",
    "No posts yet": "अद्याप पोस्ट नाहीत",
    "Loading campaign...": "मोहीम लोड होत आहे...",
    "Loading event...": "कार्यक्रम लोड होत आहे...",
    "Loading article...": "लेख लोड होत आहे...",
    "Event Not Found": "कार्यक्रम सापडला नाही",
    "Article Not Found": "लेख सापडला नाही",
    "About this Event": "या कार्यक्रमाबद्दल",
    Date: "तारीख",
    Time: "वेळ",
    Location: "ठिकाण",
    Attendees: "उपस्थित",
    "Donation Progress": "देणगी प्रगती",
    "Donation appeal not found": "देणगी आवाहन सापडले नाही",
    "The seva donation you are looking for is unavailable.": "तुम्ही शोधत असलेली सेवा देणगी उपलब्ध नाही.",
    "About this seva": "या सेवेबद्दल",
    "Together, we can serve with purpose": "एकत्रितपणे आपण उद्देशपूर्ण सेवा करू शकतो",
    "All donors": "सर्व देणगीदार",
    "Every contribution matters": "प्रत्येक योगदान महत्त्वाचे आहे",
    "Admin tools": "अॅडमिन साधने",
    "Manage existing campaigns": "विद्यमान मोहिमा व्यवस्थापित करा",
    "Edit campaign details, stop campaigns, or permanently delete them.": "मोहीम तपशील संपादित करा, मोहिमा थांबवा किंवा कायमस्वरूपी हटवा.",
    "Edit campaign": "मोहीम संपादित करा",
    "No campaigns have been created yet.": "अद्याप कोणत्याही मोहिमा तयार केलेल्या नाहीत.",
    "Create your first campaign": "तुमची पहिली मोहीम तयार करा",
    Stop: "थांबवा",
    Resume: "पुन्हा सुरू करा",
    "Delete permanently": "कायमस्वरूपी हटवा",
    "No applications yet": "अद्याप अर्ज नाहीत",
    "Skills and experience": "कौशल्ये आणि अनुभव",
    "Why they want to volunteer": "त्यांना स्वयंसेवक का व्हायचे आहे",
    "Create new campaign": "नवीन मोहीम तयार करा",
    "Set up a new seva campaign for members and donors.": "सदस्य आणि देणगीदारांसाठी नवीन सेवा मोहीम तयार करा.",
    "Campaign details": "मोहीम तपशील",
    "Add the information that will appear on the campaign page.": "मोहीम पृष्ठावर दिसणारी माहिती जोडा.",
    "Member accounts": "सदस्य खाती",
    "View and search members →": "सदस्य पहा आणि शोधा →",
    "Admin accounts": "अॅडमिन खाती",
    "View and manage admins →": "अॅडमिन पहा आणि व्यवस्थापित करा →",
    "Delete this account?": "हे खाते हटवायचे?",
    "Campaign lifecycle": "मोहीम जीवनचक्र",
    "Edit values": "मूल्ये संपादित करा",
    "Stop campaign": "मोहीम थांबवा",
    "Share your experience": "तुमचा अनुभव शेअर करा",
    "Login in to post updates, photos, and connect with the community.": "अपडेट आणि फोटो पोस्ट करण्यासाठी व समुदायाशी जोडण्यासाठी लॉग इन करा.",
    "Upload failed": "अपलोड अयशस्वी",
    Photo: "फोटो",
    Like: "आवडले",
    Comment: "टिप्पणी",
    Share: "शेअर करा",
    "See less": "कमी पहा",
    "See more": "अधिक पहा",
    "Write a comment...": "टिप्पणी लिहा...",
    "Insert emoji": "इमोजी घाला",
    "No comments yet. Be the first to reply!": "अद्याप टिप्पण्या नाहीत. उत्तर देणारे पहिले बना!",
    "Could not load the feed. Please try again.": "फीड लोड होऊ शकली नाही. कृपया पुन्हा प्रयत्न करा.",
    Retry: "पुन्हा प्रयत्न करा",
    "Welcome to the Feed": "फीडमध्ये तुमचे स्वागत आहे",
    "This is where members share their Seva experiences. Be the first to post an update!": "येथे सदस्य त्यांचे सेवा अनुभव शेअर करतात. अपडेट पोस्ट करणारे पहिले बना!",
    "Scroll for more": "अधिक पाहण्यासाठी स्क्रोल करा",
    "You've reached the end of the feed": "तुम्ही फीडच्या शेवटी पोहोचला आहात",
    "View and search members": "सदस्य पहा आणि शोधा",
  },
};

const supplementalTranslations: Record<Exclude<Language, "en">, Record<string, string>> = {
  hi: {
    Dharma: "धर्म",
    and: "और",
    Active: "सक्रिय",
    Stopped: "रुका हुआ",
    Administration: "प्रशासन",
    Closed: "बंद",
    "My account": "मेरा खाता",
    "Back to Updates": "अपडेट पर वापस जाएं",
    "About this Campaign": "इस अभियान के बारे में",
    "About this Event": "इस कार्यक्रम के बारे में",
    "Email:": "ईमेल:",
    "Phone:": "फोन:",
    "Location:": "स्थान:",
    "Ends:": "समाप्त:",
    "Mon - Fri": "सोम - शुक्र",
    Saturday: "शनिवार",
    Sunday: "रविवार",
    "9:00 AM - 6:00 PM": "सुबह 9:00 - शाम 6:00",
    "10:00 AM - 2:00 PM": "सुबह 10:00 - दोपहर 2:00",
    "Protecting ancient temples, preserving sacred texts, and defending the rights of Sanatani communities.":
      "प्राचीन मंदिरों की रक्षा, पवित्र ग्रंथों का संरक्षण और सनातनी समुदायों के अधिकारों की रक्षा करना।",
    "Providing food, shelter, disaster relief, and medical aid to those in need, seeing the divine in all beings.":
      "जरूरतमंदों को भोजन, आश्रय, आपदा राहत और चिकित्सा सहायता देना तथा सभी प्राणियों में ईश्वर को देखना।",
    "Educating the youth about Vedic sciences, history, and spiritual practices through gurukuls and modern mediums.":
      "गुरुकुलों और आधुनिक माध्यमों से युवाओं को वैदिक विज्ञान, इतिहास और आध्यात्मिक साधनाओं की शिक्षा देना।",
    "Building a strong, connected network of members and believers across the globe to act as one cohesive force.":
      "दुनिया भर के सदस्यों और श्रद्धालुओं का मजबूत, जुड़ा हुआ नेटवर्क बनाना ताकि एकजुट शक्ति के रूप में कार्य किया जा सके।",
    "Help organize and manage large scale dharmic events and local gatherings.":
      "बड़े धार्मिक कार्यक्रमों और स्थानीय सभाओं को आयोजित और संचालित करने में सहायता करें।",
    "Participate in food distribution, medical camps, and disaster relief efforts.":
      "भोजन वितरण, चिकित्सा शिविरों और आपदा राहत प्रयासों में भाग लें।",
    "Email us directly with your location and skills, and our regional coordinator will reach out.":
      "अपना स्थान और कौशल हमें सीधे ईमेल करें, हमारे क्षेत्रीय समन्वयक आपसे संपर्क करेंगे।",
    "Edit image": "चित्र संपादित करें",
    "Campaign title": "अभियान का शीर्षक",
    "Campaign description": "अभियान का विवरण",
    Description: "विवरण",
    "Goal amount (INR)": "लक्ष्य राशि (INR)",
    "Campaign image": "अभियान चित्र",
    "Upload a campaign image": "अभियान चित्र अपलोड करें",
    "JPG, PNG, GIF, or WebP · 4 MB max": "JPG, PNG, GIF या WebP · अधिकतम 4 MB",
    "Choose image": "चित्र चुनें",
    "Image upload failed. Please try again.": "चित्र अपलोड विफल हुआ। कृपया फिर प्रयास करें।",
    "Campaign preview": "अभियान पूर्वावलोकन",
    "Edit campaign image": "अभियान चित्र संपादित करें",
    "e.g. Winter Blanket Seva": "जैसे: सर्दियों के कंबल की सेवा",
    "Describe the purpose and impact of this campaign": "इस अभियान का उद्देश्य और प्रभाव बताएं",
    "Name is required": "नाम आवश्यक है",
    "Invalid email address": "अमान्य ईमेल पता",
    "Subject is required": "विषय आवश्यक है",
    "Message must be at least 10 characters": "संदेश कम से कम 10 अक्षरों का होना चाहिए",
    "Have a question, suggestion, or want to collaborate? Reach out to us. We are always eager to connect with like-minded individuals.":
      "कोई प्रश्न, सुझाव है या सहयोग करना चाहते हैं? हमसे संपर्क करें। हम समान विचारधारा वाले लोगों से जुड़ने के लिए हमेशा उत्सुक हैं।",
    "Email us directly": "हमें सीधे ईमेल करें",
    "Phone Number (Optional)": "फोन नंबर (वैकल्पिक)",
    "How can we help?": "हम आपकी कैसे सहायता कर सकते हैं?",
    "Your message here...": "अपना संदेश यहां लिखें...",
    "Message Sent": "संदेश भेज दिया गया",
    "We have received your message and will reply shortly.": "हमें आपका संदेश मिल गया है और हम जल्द ही जवाब देंगे।",
    Error: "त्रुटि",
    "Failed to send message. Please try again.": "संदेश भेजने में विफल। कृपया फिर प्रयास करें।",
    "Contact Us Direct": "सीधे हमसे संपर्क करें",
    "At least 8 characters": "कम से कम 8 अक्षर",
    "Paste your reset token": "अपना रीसेट टोकन पेस्ट करें",
    "Repeat your new password": "नया पासवर्ड दोहराएं",
    "Your full name": "आपका पूरा नाम",
    "Upload failed": "अपलोड विफल",
    "Add photo": "फोटो जोड़ें",
    "Remove media": "मीडिया हटाएं",
    "Add the information that will appear on the campaign page.": "अभियान पेज पर दिखाई देने वाली जानकारी जोड़ें।",
    "Share your thoughts, or community updates...": "अपने विचार या सामुदायिक अपडेट साझा करें...",
    "Tell us about your skills, interests or experience": "अपने कौशल, रुचियों या अनुभव के बारे में बताएं",
    "Share how you would like to contribute to the foundation": "बताएं कि आप फाउंडेशन में कैसे योगदान देना चाहेंगे",
    "Search by name or email": "नाम या ईमेल से खोजें",
    "Post actions": "पोस्ट क्रियाएं",
    "Member QR code": "सदस्य QR कोड",
    "Selected post media": "चयनित पोस्ट मीडिया",
    "View all posts": "सभी पोस्ट देखें",
    "View seva campaigns, projects, and events": "सेवा अभियान, परियोजनाएं और कार्यक्रम देखें",
    "Switch to light mode": "लाइट मोड पर जाएं",
    "Switch to dark mode": "डार्क मोड पर जाएं",
    "Hide password": "पासवर्ड छिपाएं",
    "Show password": "पासवर्ड दिखाएं",
    "Go to home": "होम पर जाएं",
    "Seva sections": "सेवा अनुभाग",
    "Gallery image": "गैलरी चित्र",
    "Ancient Temple Architecture": "प्राचीन मंदिर वास्तुकला",
    "Write a comment...": "टिप्पणी लिखें...",
    "Raksha (Protection)": "रक्षा (संरक्षण)",
    "Seva (Service)": "सेवा (सेवा)",
    "Gyan (Knowledge)": "ज्ञान (ज्ञान)",
    "Sangathan (Unity)": "संगठन (एकता)",
    Status: "स्थिति",
    Dashboard: "डैशबोर्ड",
    "No upcoming events": "कोई आगामी कार्यक्रम नहीं है",
    "No active campaigns": "कोई सक्रिय अभियान नहीं है",
    "No projects found": "कोई परियोजना नहीं मिली",
    "No images found": "कोई चित्र नहीं मिला",
    "What began as a small collective of devotees in Varanasi has grown into a nationwide movement. We recognized that preserving our heritage requires more than just reverence—it requires organized, sustained effort.":
      "वाराणसी में भक्तों के एक छोटे समूह से शुरू हुआ हमारा प्रयास आज राष्ट्रव्यापी आंदोलन बन गया है। हमने समझा कि विरासत के संरक्षण के लिए केवल श्रद्धा नहीं, बल्कि संगठित और निरंतर प्रयास आवश्यक है।",
    "Over the years, the Mahakal Sanatan Raksha Foundation has spearheaded the renovation of neglected village temples, provided ongoing support for traditional pathshalas, and mobilized thousands of members during national crises.":
      "वर्षों से महाकाल सनातन रक्षा फाउंडेशन ने उपेक्षित ग्राम मंदिरों के पुनर्निर्माण का नेतृत्व किया है, पारंपरिक पाठशालाओं को निरंतर सहयोग दिया है और राष्ट्रीय संकटों में हजारों सदस्यों को संगठित किया है।",
    "Our approach merges the deep wisdom of our ancestors with the operational excellence of a modern institution. Every rupee donated and every hour contributed by a member is tracked, measured, and optimized for maximum impact.":
      "हमारा दृष्टिकोण पूर्वजों के गहन ज्ञान को आधुनिक संस्था की कार्यकुशलता से जोड़ता है। दान किया गया हर रुपया और सदस्य द्वारा दिया गया हर घंटा अधिकतम प्रभाव के लिए दर्ज, मापा और बेहतर बनाया जाता है।",
  },
  mr: {
    Dharma: "धर्म",
    and: "आणि",
    Active: "सक्रिय",
    Stopped: "थांबलेले",
    Administration: "प्रशासन",
    Closed: "बंद",
    "My account": "माझे खाते",
    "Back to Updates": "अपडेट्सकडे परत जा",
    "About this Campaign": "या मोहिमेबद्दल",
    "About this Event": "या कार्यक्रमाबद्दल",
    "Email:": "ईमेल:",
    "Phone:": "फोन:",
    "Location:": "ठिकाण:",
    "Ends:": "समाप्त:",
    "Mon - Fri": "सोम - शुक्र",
    Saturday: "शनिवार",
    Sunday: "रविवार",
    "9:00 AM - 6:00 PM": "सकाळी 9:00 - संध्याकाळी 6:00",
    "10:00 AM - 2:00 PM": "सकाळी 10:00 - दुपारी 2:00",
    "Protecting ancient temples, preserving sacred texts, and defending the rights of Sanatani communities.":
      "प्राचीन मंदिरांचे संरक्षण, पवित्र ग्रंथांचे जतन आणि सनातनी समुदायांच्या हक्कांचे रक्षण करणे.",
    "Providing food, shelter, disaster relief, and medical aid to those in need, seeing the divine in all beings.":
      "गरजूंना अन्न, निवारा, आपत्ती मदत आणि वैद्यकीय सहाय्य देणे तसेच सर्व जीवांमध्ये दैवीत्व पाहणे.",
    "Educating the youth about Vedic sciences, history, and spiritual practices through gurukuls and modern mediums.":
      "गुरुकुल आणि आधुनिक माध्यमांद्वारे तरुणांना वैदिक शास्त्रे, इतिहास आणि आध्यात्मिक साधनांचे शिक्षण देणे.",
    "Building a strong, connected network of members and believers across the globe to act as one cohesive force.":
      "जगभरातील सदस्य आणि श्रद्धावानांचे मजबूत, जोडलेले जाळे उभारणे जेणेकरून एकसंध शक्ती म्हणून कार्य करता येईल.",
    "Help organize and manage large scale dharmic events and local gatherings.":
      "मोठ्या धार्मिक कार्यक्रमांचे आणि स्थानिक मेळाव्यांचे आयोजन व व्यवस्थापन करण्यास मदत करा.",
    "Participate in food distribution, medical camps, and disaster relief efforts.":
      "अन्न वितरण, वैद्यकीय शिबिरे आणि आपत्ती मदत कार्यात सहभागी व्हा.",
    "Email us directly with your location and skills, and our regional coordinator will reach out.":
      "तुमचे ठिकाण आणि कौशल्ये आम्हाला थेट ईमेल करा, आमचे प्रादेशिक समन्वयक तुमच्याशी संपर्क साधतील.",
    "Edit image": "चित्र संपादित करा",
    "Campaign title": "मोहीम शीर्षक",
    "Campaign description": "मोहीम वर्णन",
    Description: "वर्णन",
    "Goal amount (INR)": "लक्ष्य रक्कम (INR)",
    "Campaign image": "मोहीम चित्र",
    "Upload a campaign image": "मोहीम चित्र अपलोड करा",
    "JPG, PNG, GIF, or WebP · 4 MB max": "JPG, PNG, GIF किंवा WebP · कमाल 4 MB",
    "Choose image": "चित्र निवडा",
    "Image upload failed. Please try again.": "चित्र अपलोड अयशस्वी झाले. कृपया पुन्हा प्रयत्न करा.",
    "Campaign preview": "मोहीम पूर्वावलोकन",
    "Edit campaign image": "मोहीम चित्र संपादित करा",
    "e.g. Winter Blanket Seva": "उदा. हिवाळी ब्लँकेट सेवा",
    "Describe the purpose and impact of this campaign": "या मोहिमेचा उद्देश आणि परिणाम सांगा",
    "Name is required": "नाव आवश्यक आहे",
    "Invalid email address": "अवैध ईमेल पत्ता",
    "Subject is required": "विषय आवश्यक आहे",
    "Message must be at least 10 characters": "संदेश किमान 10 अक्षरांचा असावा",
    "How can we help?": "आम्ही कशी मदत करू शकतो?",
    "Your message here...": "तुमचा संदेश येथे लिहा...",
    "Message Sent": "संदेश पाठवला",
    "We have received your message and will reply shortly.": "आम्हाला तुमचा संदेश मिळाला आहे आणि आम्ही लवकरच उत्तर देऊ.",
    Error: "त्रुटी",
    "Failed to send message. Please try again.": "संदेश पाठवता आला नाही. कृपया पुन्हा प्रयत्न करा.",
    "At least 8 characters": "किमान 8 अक्षरे",
    "Paste your reset token": "तुमचा रीसेट टोकन पेस्ट करा",
    "Repeat your new password": "नवीन पासवर्ड पुन्हा लिहा",
    "Your full name": "तुमचे पूर्ण नाव",
    "Add photo": "फोटो जोडा",
    "Remove media": "मीडिया काढा",
    "Share your thoughts, or community updates...": "तुमचे विचार किंवा सामुदायिक अपडेट्स शेअर करा...",
    "Tell us about your skills, interests or experience": "तुमची कौशल्ये, आवडी किंवा अनुभव सांगा",
    "Share how you would like to contribute to the foundation": "तुम्हाला फाउंडेशनमध्ये कसे योगदान द्यायचे आहे ते सांगा",
    "Search by name or email": "नाव किंवा ईमेलने शोधा",
    "Post actions": "पोस्ट क्रिया",
    "Member QR code": "सदस्य QR कोड",
    "Selected post media": "निवडलेला पोस्ट मीडिया",
    "Hide password": "पासवर्ड लपवा",
    "Show password": "पासवर्ड दाखवा",
    "Seva sections": "सेवा विभाग",
    "Gallery image": "गॅलरी चित्र",
    "Ancient Temple Architecture": "प्राचीन मंदिर वास्तुकला",
    "Raksha (Protection)": "रक्षा (संरक्षण)",
    "Seva (Service)": "सेवा (सेवा)",
    "Gyan (Knowledge)": "ज्ञान (ज्ञान)",
    "Sangathan (Unity)": "संघटन (एकता)",
    Status: "स्थिती",
    Dashboard: "डॅशबोर्ड",
    "No upcoming events": "आगामी कार्यक्रम नाहीत",
    "No active campaigns": "सक्रिय मोहिमा नाहीत",
    "No projects found": "प्रकल्प सापडले नाहीत",
    "No images found": "चित्रे सापडली नाहीत",
    "What began as a small collective of devotees in Varanasi has grown into a nationwide movement. We recognized that preserving our heritage requires more than just reverence—it requires organized, sustained effort.":
      "वाराणसीतील भक्तांच्या छोट्या समूहापासून सुरू झालेला प्रयत्न आज देशव्यापी चळवळ बनला आहे. वारशाचे जतन करण्यासाठी केवळ श्रद्धा नव्हे तर संघटित आणि सातत्यपूर्ण प्रयत्न आवश्यक आहेत हे आम्हाला जाणवले.",
    "Over the years, the Mahakal Sanatan Raksha Foundation has spearheaded the renovation of neglected village temples, provided ongoing support for traditional pathshalas, and mobilized thousands of members during national crises.":
      "गेल्या काही वर्षांत महाकाल सनातन रक्षा फाउंडेशनने दुर्लक्षित ग्राममंदिरांच्या नूतनीकरणाचे नेतृत्व केले, पारंपरिक पाठशाळांना सातत्याने मदत केली आणि राष्ट्रीय संकटांमध्ये हजारो सदस्यांना संघटित केले.",
    "Our approach merges the deep wisdom of our ancestors with the operational excellence of a modern institution. Every rupee donated and every hour contributed by a member is tracked, measured, and optimized for maximum impact.":
      "आमचा दृष्टिकोन पूर्वजांचे सखोल ज्ञान आणि आधुनिक संस्थेची कार्यक्षमता यांचा संगम घडवतो. दान केलेला प्रत्येक रुपया आणि सदस्याने दिलेला प्रत्येक तास नोंदवला, मोजला आणि जास्तीत जास्त परिणामासाठी सुधारला जातो.",
  },
};

function replaceTranslations(text: string, language: Language) {
  if (language === "en") return text;
  const dictionary = { ...translations[language], ...supplementalTranslations[language] };
  return Object.entries(dictionary)
    .sort(([a], [b]) => b.length - a.length)
    .reduce((result, [source, target]) => {
      const escapedSource = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return result.replace(new RegExp(escapedSource, "gi"), target);
    }, text);
}

type TranslationState = { original: string; translated: string };

function translateDocument(
  language: Language,
  textNodes: Map<Text, TranslationState>,
  attributes: Map<Element, Map<string, TranslationState>>,
) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    if (
      !parent ||
      ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName) ||
      parent.closest("[data-no-translate='true']")
    ) {
      continue;
    }
    const state = textNodes.get(textNode);
    const original = state && textNode.data === state.translated ? state.original : textNode.data;
    const translated = replaceTranslations(original, language);
    textNodes.set(textNode, { original, translated });
    if (textNode.data !== translated) textNode.data = translated;
  }

  document.querySelectorAll<HTMLElement>("*").forEach((element) => {
    for (const attribute of ["aria-label", "title", "placeholder", "alt"]) {
      const current = element.getAttribute(attribute);
      if (current === null) continue;
      let stateMap = attributes.get(element);
      if (!stateMap) {
        stateMap = new Map();
        attributes.set(element, stateMap);
      }
      const state = stateMap.get(attribute);
      const original = state && current === state.translated ? state.original : current;
      const translated = replaceTranslations(original, language);
      stateMap.set(attribute, { original, translated });
      if (current !== translated) element.setAttribute(attribute, translated);
    }
  });
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === "hi" || stored === "mr" ? stored : "en";
  });
  const textNodes = useRef(new Map<Text, TranslationState>());
  const attributes = useRef(new Map<Element, Map<string, TranslationState>>());

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: Language) => {
        setLanguageState(nextLanguage);
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      },
    }),
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language;
    const apply = () => translateDocument(language, textNodes.current, attributes.current);
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
