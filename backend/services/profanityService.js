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

// Normalize: lowercase, remove spaces/dashes/dots/underscores
function normalize(text) {
  return text.toLowerCase().replace(/[\s\-_.]/g, '');
}

const normalizedBanned = BANNED.map(normalize);

function containsProfanity(text) {
  if (!text) return false;
  const norm = normalize(text);
  return normalizedBanned.some(word => norm.includes(word));
}

module.exports = { containsProfanity };
