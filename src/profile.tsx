import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Preferences, Profile, STYLES, Style, OCCASIONS, Occasion, toggleValue, validateAge } from './domain';
import { C } from './theme';
// Curated clothing brands appearing in Dolap's public catalogue; no affiliation.
export const BRANDS = ['Adidas', 'Bershka', 'Beymen', 'Colin’s', 'Columbia', 'DeFacto', 'Derimod', 'Diesel', 'H&M', 'İpekyol', 'Jack & Jones', 'Koton', 'Lacoste', 'LC Waikiki', 'Levi’s', 'Mango', 'Massimo Dutti', 'Mavi', 'Network', 'New Balance', 'Nike', 'Oysho', 'Pull & Bear', 'Puma', 'Reebok', 'Skechers', 'Stradivarius', 'The North Face', 'Tommy Hilfiger', 'Trendyolmilla', 'Under Armour', 'U.S. Polo Assn.', 'Vakko', 'Zara'];
const norm = (value: string) => value.trim().toLocaleLowerCase('tr');
export function SelectList({ label, options, values, onChange, multiple = false, custom = false }: { label: string; options: readonly string[]; values: string[]; onChange: (values: string[]) => void; multiple?: boolean; custom?: boolean }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState('');
  const all = [...new Set([...options, ...values])];
  function choose(value: string) { onChange(multiple ? toggleValue(values, value) : [value]); if (!multiple) setOpen(false); }
  return <><Text style={s.label}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { setQuery(''); setOpen(true); }} style={s.input}><Text style={s.text}>{values.length ? values.join(' · ') : 'Seçebilirsin'} ▾</Text></Pressable>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}><SafeAreaView style={s.page}><View style={s.content}><Text style={s.title}>{label}</Text><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Listede ara" accessibilityLabel={`${label} listesinde ara`} maxLength={60} style={s.input} /><ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>{all.filter(x => norm(x).includes(norm(query))).map(value => <Pressable key={value} accessibilityRole="checkbox" accessibilityState={{ checked: values.includes(value) }} onPress={() => choose(value)} style={s.option}><Text style={s.text}>{value}</Text><Text>{values.includes(value) ? '✓' : '+'}</Text></Pressable>)}{custom && query.trim() && !all.some(x => norm(x) === norm(query)) && <Pressable style={s.option} onPress={() => choose(query.trim())}><Text style={s.text}>“{query.trim()}” ekle</Text></Pressable>}</ScrollView><Pressable accessibilityRole="button" style={s.button} onPress={() => setOpen(false)}><Text style={s.white}>Tamam</Text></Pressable></View></SafeAreaView></Modal></>;
}
export function ProfileEditor({ profile, preferences, onSave }: { profile?: Profile; preferences: Preferences; onSave: (profile: Profile, styles: Style[]) => void }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState(profile?.age?.toString() ?? '');
  const [gender, setGender] = useState(profile?.gender ?? 'Belirtmek istemiyorum');
  const [brands, setBrands] = useState(profile?.brands ?? []);
  const [styles, setStyles] = useState<Style[]>(preferences.styles);
  const [collections, setCollections] = useState(profile?.collections ?? []);
  const [coverage, setCoverage] = useState(profile?.coverage ?? 'Fark etmez');
  const [occasions, setOccasions] = useState<Occasion[]>(profile?.occasions ?? []);
  const [error, setError] = useState('');
  function submit() {
    const ageProblem = validateAge(age);
    if (ageProblem) { setError(ageProblem); return; }
    if (!styles.length) { setError('En az bir tarz seç.'); return; }
    onSave({ name: name.trim(), age: age ? Number(age) : undefined, gender, brands, collections, coverage, occasions }, styles);
  }
  return <Modal visible animationType="slide" onRequestClose={submit}><SafeAreaView style={s.page}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { flex: undefined }]}><Text style={s.kicker}>SANA AİT BİR BAŞLANGIÇ</Text><Text style={s.title}>Seni biraz tanıyalım.</Text><Text style={s.text}>Seçtiklerin ilk önerileri şekillendirir. Kaydırdıkça birlikte keşfederiz.</Text>
    <Text style={s.label}>Adın veya takma adın</Text><TextInput accessibilityLabel="Adın veya takma adın" value={name} onChangeText={setName} maxLength={40} placeholder="Sana nasıl seslenelim?" style={s.input} />
    <Text style={s.label}>Yaşın · isteğe bağlı</Text><TextInput accessibilityLabel="Yaşın" value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={3} placeholder="Boş bırakabilirsin" style={s.input} />
    <SelectList label="Cinsiyetin" options={['Kadın', 'Erkek', 'Nonbinary', 'Belirtmek istemiyorum']} values={[gender]} onChange={v => setGender(v[0])} />
    <SelectList label="Öneri koleksiyonları · isteğe bağlı" options={['Kadın', 'Erkek', 'Unisex']} values={collections} multiple onChange={setCollections} />
    <SelectList label="Örtücülük tercihin" options={['Fark etmez', 'Daha örtücü']} values={[coverage]} onChange={v => setCoverage(v[0])} />
    <SelectList label="Sık giyindiğin ortamlar" options={OCCASIONS} values={occasions} multiple onChange={v => setOccasions(v as Occasion[])} />
    <SelectList label="Sana yakın tarzlar" options={STYLES} values={styles} multiple onChange={v => setStyles(v as Style[])} />
    <SelectList label="Alışveriş yaptığın markalar" options={BRANDS} values={brands} multiple custom onChange={setBrands} />
    <Text style={[s.text, { marginVertical: 20, fontSize: 12 }]}>Bilgilerin bu cihazda kalır. Yaş ve cinsiyet tarzlarını sınırlandırmaz. Marka ve tarz seçimlerini sonra değiştirebilirsin.</Text>{!!error && <Text style={{ color: C.warningText }}>{error}</Text>}<Pressable accessibilityRole="button" style={s.button} onPress={submit}><Text style={s.white}>Tarzımı keşfet</Text></Pressable></ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>;
}
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: C.bg }, content: { flex: 1, padding: 24, width: '100%', maxWidth: 760, alignSelf: 'center' }, title: { fontSize: 30, color: C.ink, marginBottom: 16 }, kicker: { fontSize: 10, letterSpacing: 2, color: C.green, marginBottom: 18 }, label: { marginTop: 24, marginBottom: 10, fontSize: 13, color: C.green }, text: { color: C.ink, fontSize: 15, lineHeight: 23 }, input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 15, backgroundColor: C.white, fontSize: 16, color: C.ink }, option: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 17, borderBottomWidth: 1, borderColor: C.line }, button: { backgroundColor: C.ink, borderRadius: 15, padding: 17, alignItems: 'center', marginVertical: 14 }, white: { color: C.white, fontWeight: '600' } });
