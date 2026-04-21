const BANNED = [
  // Arabic
  'كس','كوس','كوسة','كسمك','كسختك','كسأمك','كس امك','كس اخوك',
  'طيز','طيزك','طيزه','طيزها',
  'عير','عيرك','عيره','زب','زبي','زبك','زبه','زبر','زبور',
  'خول','خوله','خولات','مخنث','مخنثين',
  'شرموطة','شرموط','عاهرة','عاهر','قحبة','قحب','متناكة','متناك',
  'نيك','ينيك','تنيك','انيك','نيكك','نيكه','مناك',
  'لوطي','لواط','لوطيين',
  'حمار','حمارة','كلب','كلبة','وسخ','وسخة',
  'منيوك','منيوكة','مرة','بعير',
  // English
  'fuck','fucker','fucking','fucked','fucks',
  'shit','shits','bullshit',
  'bitch','bitches',
  'ass','asshole','asses',
  'bastard','bastards',
  'cunt','cunts',
  'dick','dicks','dickhead',
  'cock','cocks',
  'pussy','pussies',
  'whore','whores',
  'slut','sluts',
  'nigger','nigga','niggas',
  'retard','retarded',
  'faggot','fag','fags',
];

function containsProfanity(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BANNED.some(word => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![a-zA-Zء-ي])${escaped}(?![a-zA-Zء-ي])`, 'i');
    return regex.test(lower);
  });
}

module.exports = { containsProfanity };
