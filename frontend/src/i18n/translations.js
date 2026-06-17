// ── Arabic → English UI translations ─────────────────────────────────────────
// Arabic is the default language and is used as the lookup key. When the active
// language is English, t(key) returns the mapping below; otherwise it returns
// the Arabic key unchanged, so the Arabic UI stays exactly as it is.

export const EN = {
  // ── Navbar ──
  'تفعيل الوضع الداكن': 'Switch to dark mode',
  'تفعيل الوضع الفاتح': 'Switch to light mode',
  'الخريطة': 'Map',
  'أفضل الزارعين': 'Top Planters',
  'المحافظات': 'Governorates',
  'جودة الهواء': 'Air Quality',
  'لوحة التحكم': 'Dashboard',
  'خروج': 'Logout',
  'دخول': 'Login',
  'تسجيل جديد': 'Sign Up',
  'تسجيل': 'Sign Up',
  'القائمة': 'Menu',
  'الملف الشخصي': 'Profile',
  'خروج من الحساب': 'Sign out of account',
  'العربية': 'العربية',
  'الإنجليزية': 'English',

  // ── App / footer ──
  'جاري التحميل...': 'Loading...',
  'جميع الحقوق محفوظة': 'All rights reserved',
  'تواصل معنا ✉️ greeniq964@gmail.com': 'Contact us ✉️ greeniq964@gmail.com',
  'أرسل ملاحظة': 'Send feedback',

  // ── AQI category labels (HomePage + AirQualityPage) ──
  'غير متاح': 'Unavailable',
  'جيد': 'Good',
  'مقبول': 'Moderate',
  'غير صحي نسبياً': 'Unhealthy for Sensitive',
  'غير صحي': 'Unhealthy',
  'خطر شديد': 'Very Unhealthy',
  'كارثي': 'Hazardous',
  'خطر': 'Hazardous',

  // ── HomePage ──
  'زراعة الأشجار': 'Tree Planting',
  'مؤشر جودة الهواء': 'Air Quality Index',
  'من أجل مستقبل أخضر لعراقنا': 'For a greener future for our Iraq',
  'أهلاً بك،': 'Welcome,',
  'إجمالي الأشجار في العراق:': 'Total trees in Iraq:',
  'CO₂ ممتص:': 'CO₂ absorbed:',
  'O₂ منتج:': 'O₂ produced:',
  'كجم': 'kg',
  'خريطة العراق الأخضر': 'Green Iraq Map',
  'مباشر': 'Live',
  'ازرع شجرة الآن': 'Plant a tree now',

  // ── Provinces / governorates ──
  'بغداد': 'Baghdad',
  'البصرة': 'Basra',
  'نينوى': 'Nineveh',
  'أربيل': 'Erbil',
  'النجف': 'Najaf',
  'كربلاء': 'Karbala',
  'السليمانية': 'Sulaymaniyah',
  'دهوك': 'Duhok',
  'الأنبار': 'Anbar',
  'ديالى': 'Diyala',
  'كركوك': 'Kirkuk',
  'واسط': 'Wasit',
  'بابل': 'Babylon',
  'ميسان': 'Maysan',
  'ذي قار': 'Dhi Qar',
  'المثنى': 'Muthanna',
  'القادسية': 'Al-Qadisiyah',
  'صلاح الدين': 'Saladin',

  // ── MapPage ──
  'تعذّر تحديد موقعك، يرجى السماح بالوصول إلى الموقع': 'Could not determine your location, please allow location access',
  'لم يتم تحديد موقعك بعد': 'Your location has not been determined yet',
  'اسم الشجرة يجب ألا يتجاوز 100 حرف': 'The tree name must not exceed 100 characters',
  'الملاحظات يجب ألا تتجاوز 500 حرف': 'Notes must not exceed 500 characters',
  'حدث خطأ': 'An error occurred',
  'خريطة الأشجار': 'Trees Map',
  'إلغاء': 'Cancel',
  'غرس شجرة جديدة': 'Plant a New Tree',
  'أدخل بيانات الشجرة': 'Enter Tree Details',
  'جاري تحديد موقعك...': 'Determining your location...',
  'تم تحديد موقعك:': 'Your location set:',
  'اسم الشجرة (اختياري)': 'Tree name (optional)',
  'ادخل العمر التقريبي للشجرة حاليا (بالسنوات)': 'Enter the tree’s approximate current age (in years)',
  'ملاحظات (اختياري)': 'Notes (optional)',
  'جاري الغرس...': 'Planting...',
  'تأكيد الغرس': 'Confirm Planting',
  'تم إضافة شجرتك على الخارطة — استمر في المساهمة!': 'Your tree has been added to the map — keep contributing!',
  'شجرة': 'Tree',
  'مستخدم عضو': 'User',
  'زُرعت بواسطة:': 'Planted by:',
  'عمر الشجرة:': 'Tree age:',
  'CO₂ المختزل:': 'CO₂ absorbed:',
  'O₂ المنبعث:': 'O₂ released:',
  'عرض الملف الشخصي': 'View Profile',
  'أشجارك': 'Your trees',
  'أشجار الآخرين': 'Others’ trees',

  // ── Leaderboard ──
  'تعذّر تحميل البيانات': 'Failed to load data',
  'أفضل 100 مستخدم حسب عدد الأشجار المزروعة': 'Top 100 users by number of trees planted',
  'لا يوجد زارعون بعد، كن الأول! 🌱': 'No planters yet, be the first! 🌱',

  // ── UserProfileModal ──
  'رابط': 'Link',
  'الأشجار المزروعة': 'Trees Planted',
  'CO₂ المختزل': 'CO₂ Absorbed',
  'O₂ المنبعث': 'O₂ Released',
  'التواصل الاجتماعي': 'Social Media',

  // ── GovernoratesPage ──
  'أفضل 3 مساهمين في تحسين جو المحافظة': 'Top 3 contributors to improving the governorate’s air',
  'لا يوجد بيانات بعد لهذه المحافظة 🌱': 'No data yet for this governorate 🌱',
  'اضغط على اسم أي شخص لعرض ملفه الشخصي': 'Tap anyone’s name to view their profile',
  'أفضل المحافظات': 'Top Governorates',
  'اضغط على أي محافظة لعرض أفضل المساهمين فيها': 'Tap any governorate to view its top contributors',
  'لا توجد بيانات بعد — كن أول من يزرع! 🌱': 'No data yet — be the first to plant! 🌱',
  '* يتم تصنيف المحافظات بناءً على إحداثيات الأشجار المزروعة': '* Governorates are ranked based on the coordinates of planted trees',

  // ── AirQualityPage ──
  'جودة الهواء في العراق': 'Air Quality in Iraq',
  'قراءات حية للمحافظات الـ 18 · مصدر: Open-Meteo Air Quality API': 'Live readings for the 18 governorates · Source: Open-Meteo Air Quality API',
  'متوسط AQI في العراق:': 'Average AQI in Iraq:',
  'نقاء': 'purity',
  'تعذّر تحميل بيانات جودة الهواء، يرجى المحاولة لاحقاً': 'Failed to load air quality data, please try again later',
  'البيانات مخزنة مؤقتاً لمدة ساعة في السيرفر': 'Data is cached for one hour on the server',
  'آخر تحديث:': 'Last updated:',
  'جاري التحديث...': 'Updating...',
  'تحديث': 'Refresh',
  'البيانات مقدمة من': 'Data provided by',
  'مؤشر AQI محسوب من PM2.5 بمعادلة EPA الأمريكية': 'AQI is calculated from PM2.5 using the US EPA formula',

  // ── Login ──
  'المعرف يجب أن يكون 3 أحرف على الأقل': 'The ID must be at least 3 characters',
  'كلمة المرور يجب أن تكون 8 أحرف على الأقل': 'The password must be at least 8 characters',
  'حدث خطأ، حاول مرة أخرى': 'An error occurred, please try again',
  'تسجيل الدخول': 'Login',
  'أهلاً بك في': 'Welcome to',
  'معرف المستخدم': 'User ID',
  'أدخل معرفك': 'Enter your ID',
  'كلمة المرور': 'Password',
  'أدخل كلمة المرور': 'Enter your password',
  'جاري تسجيل الدخول...': 'Logging in...',
  'ليس لديك حساب؟': 'Don’t have an account?',
  'إنشاء حساب': 'Create account',

  // ── Register ──
  'المعرف يجب أن يكون بين 3 و 20 حرفاً': 'The ID must be between 3 and 20 characters',
  'المعرف يجب أن يحتوي على أحرف إنجليزية وأرقام و _ و . فقط': 'The ID may contain only English letters, numbers, _ and . ',
  'الاسم الظاهر يجب أن يكون بين 2 و 30 حرفاً': 'The display name must be between 2 and 30 characters',
  'كلمتا المرور غير متطابقتين': 'The passwords do not match',
  'رابط التواصل الاجتماعي يجب أن يبدأ بـ https://': 'The social media link must start with https://',
  'معرف المستخدم (UserID)': 'User ID (UserID)',
  'مثال: ahmed_ali': 'e.g. ahmed_ali',
  'أحرف إنجليزية وأرقام و _ و . فقط': 'English letters, numbers, _ and . only',
  'الاسم الظاهر': 'Display Name',
  'مثال: أحمد علي': 'e.g. Ahmed Ali',
  '8 أحرف على الأقل': 'At least 8 characters',
  'تأكيد كلمة المرور': 'Confirm Password',
  'أعد كتابة كلمة المرور': 'Re-enter the password',
  'إنشاء حساب جديد': 'Create a New Account',
  'انضم إلى مجتمع GreenIQ': 'Join the GreenIQ community',
  'تم اختيار الصورة': 'Image selected',
  'صورة الملف الشخصي (اختياري)': 'Profile picture (optional)',
  'رابط التواصل الاجتماعي': 'Social Media Link',
  '(اختياري)': '(optional)',
  'جاري إنشاء الحساب...': 'Creating account...',
  'إنشاء الحساب': 'Create Account',
  'لديك حساب؟': 'Already have an account?',
  'سجّل دخول': 'Log in',

  // ── AdminDashboard ──
  'إدارة حسابات جميع المستخدمين المسجّلين منذ إطلاق التطبيق': 'Manage the accounts of all users registered since the app launched',
  'إجمالي المستخدمين': 'Total Users',
  'مسجلون اليوم': 'Registered Today',
  'خلال 7 أيام': 'In the last 7 days',
  'ابحث باسم المستخدم أو المعرف...': 'Search by name or ID...',
  'بحث': 'Search',
  'المستخدم': 'User',
  'المعرف': 'ID',
  'الأشجار': 'Trees',
  'تاريخ التسجيل': 'Registration Date',
  'لا يوجد نتائج': 'No results',
  'أدمن': 'Admin',
  'مستخدم': 'users',

  // ── ProfilePage ──
  'جاري الحفظ...': 'Saving...',
  'امسح رمز QR': 'Scan QR Code',
  'وجّه الكاميرا نحو رمز QR الخاص بحسابك': 'Point the camera at your account’s QR code',
  'كلمتا المرور الجديدة غير متطابقتين': 'The new passwords do not match',
  'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل': 'The new password must be at least 6 characters',
  'تغيير كلمة المرور': 'Change Password',
  'تم تغيير كلمة المرور بنجاح': 'Password changed successfully',
  'كلمة المرور الحالية': 'Current Password',
  'أدخل كلمة مرورك الحالية': 'Enter your current password',
  'كلمة المرور الجديدة': 'New Password',
  '6 أحرف على الأقل': 'At least 6 characters',
  'تأكيد كلمة المرور الجديدة': 'Confirm New Password',
  'أعد كتابة كلمة المرور الجديدة': 'Re-enter the new password',
  'حفظ كلمة المرور الجديدة': 'Save New Password',
  'تعديل الملف الشخصي': 'Edit Profile',
  'رقم الهاتف': 'Phone Number',
  'روابط التواصل الاجتماعي': 'Social Media Links',
  'حفظ التغييرات': 'Save Changes',
  'الشارات': 'Badges',
  'معرف الحساب': 'Account ID',
  'الهاتف': 'Phone',
  'CO₂ ممتص (كجم)': 'CO₂ absorbed (kg)',
  'O₂ منتج (كجم)': 'O₂ produced (kg)',
  'تعديل': 'Edit',
  // Badges
  'أول خطوة': 'First Step',
  'زرعت شجرتك الأولى': 'You planted your first tree',
  'عشرة أشجار': 'Ten Trees',
  'وصلت إلى 10 أشجار': 'You reached 10 trees',
  'خمسون شجرة': 'Fifty Trees',
  'أنجزت 50 شجرة مباركة': 'You completed 50 blessed trees',
  'مئة شجرة': 'Hundred Trees',
  'بطل الغرس! 100 شجرة': 'Planting champion! 100 trees',
  'أفضل في المحافظة': 'Best in Governorate',
  'الأول في محافظتك': 'First in your governorate',
  // ── Share Impact Card ──
  'شارك إنجازك': 'Share Your Impact',
  'بطاقة الأثر البيئي': 'Impact Card',
  'بصمتي البيئية في العراق': 'My Environmental Impact in Iraq',
  'شجرة مزروعة': 'Trees Planted',
  'كجم CO₂ ممتص': 'kg CO₂ absorbed',
  'كجم O₂ منتج': 'kg O₂ produced',
  'كن جزءاً من التغيير — إزرع شجرتك': 'Be part of the change — plant your tree',
  'تنزيل الصورة': 'Download Image',
  'مشاركة': 'Share',
  'جارٍ تجهيز البطاقة...': 'Preparing your card...',
  'تم نسخ نص المشاركة': 'Caption copied to clipboard',
};

// ── Dynamic / parameterised builders (language-aware) ────────────────────────
export const builders = {
  // "X شجرة" — tree count badge
  trees: (lang, n) => (lang === 'ar' ? `${n} شجرة` : `${n} ${n === 1 ? 'tree' : 'trees'}`),
  // "X كجم"
  kg: (lang, n) => (lang === 'ar' ? `${n} كجم` : `${n} kg`),
  // "X شجرة في هذه المحافظة"
  treesInGov: (lang, n) =>
    lang === 'ar'
      ? `${n} شجرة في هذه المحافظة`
      : `${n} ${n === 1 ? 'tree' : 'trees'} in this governorate`,
  // "≈ X يوم"
  approxDays: (lang, n) => (lang === 'ar' ? `≈ ${n} يوم` : `≈ ${n} days`),
  // success toast — province name already translated by caller
  plantedSuccess: (lang, prov) =>
    lang === 'ar' ? `أحسنت! زرعت شجرتك في ${prov} 🎉` : `Well done! You planted your tree in ${prov} 🎉`,
  // tree age, from createdAt
  treeAge: (lang, createdAt) => {
    if (!createdAt) return null;
    const days = Math.floor((Date.now() - new Date(createdAt)) / 86400000);
    if (lang === 'ar') {
      if (days < 1) return 'أقل من يوم';
      if (days < 30) return `${days} يوم`;
      if (days < 365) return `${Math.floor(days / 30)} شهر`;
      const yrs = Math.floor(days / 365);
      const rem = Math.floor((days % 365) / 30);
      return rem > 0 ? `${yrs} سنة و${rem} شهر` : `${yrs} سنة`;
    }
    if (days < 1) return 'less than a day';
    if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'}`;
    if (days < 365) {
      const m = Math.floor(days / 30);
      return `${m} ${m === 1 ? 'month' : 'months'}`;
    }
    const yrs = Math.floor(days / 365);
    const rem = Math.floor((days % 365) / 30);
    const y = `${yrs} ${yrs === 1 ? 'year' : 'years'}`;
    return rem > 0 ? `${y} and ${rem} ${rem === 1 ? 'month' : 'months'}` : y;
  },
  // admin pagination: "P / N — (T مستخدم)"
  pageInfo: (lang, page, pages, total) =>
    lang === 'ar' ? `${page} / ${pages} — (${total} مستخدم)` : `${page} / ${pages} — (${total} users)`,
  // share card caption — image accompanying text for social posts
  shareCaption: (lang, trees, co2) =>
    lang === 'ar'
      ? `🌳 زرعت ${trees} شجرة في العراق وأزلت ${co2} كجم من ثاني أكسيد الكربون من الهواء! انضموا إلينا في GreenIQ 🌱`
      : `🌳 I planted ${trees} ${trees === 1 ? 'tree' : 'trees'} in Iraq and removed ${co2} kg of CO₂ from the air! Join us on GreenIQ 🌱`,
  // air quality "آخر تحديث: TIME · cached..."
  lastUpdated: (lang, time) =>
    lang === 'ar'
      ? `آخر تحديث: ${time} · البيانات مخزنة مؤقتاً لمدة ساعة في السيرفر`
      : `Last updated: ${time} · Data is cached for one hour on the server`,
};
