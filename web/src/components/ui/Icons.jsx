// Ikonkalar — lucide-react ustidagi yupqa qatlam.
//
// Nega wrapper? Butun loyihada `<Icon name="phone" />` ko'rinishida chaqiriladi va
// kategoriyalar bazadan `iconKey` (uzi, ekg, ivl...) bilan keladi. Wrapper shu nomlarni
// lucide komponentlariga bog'laydi — call-site'larni o'zgartirmasdan.
//
// To'g'ridan-to'g'ri ham ishlatsa bo'ladi: import { Wrench } from 'lucide-react'
import {
  // Uskuna yo'nalishlari
  Activity, HeartPulse, Wind, Zap, Container, FlaskConical, Droplets,
  // Interfeys
  Phone, Mail, MapPin, Clock, ArrowRight, ArrowUpRight, ArrowLeft, Check, Plus, Minus,
  ShieldCheck, Wrench, Package, FileText, Search, Globe, Menu, X, ChevronDown,
  ChevronRight, ChevronLeft, Sparkles, Send, Trash2, Pencil, Eye, EyeOff,
  LogOut, User, Settings, LayoutDashboard, Inbox, Tags, Image as ImageIcon,
  Filter, LayoutGrid, List, Star, AlertTriangle, Info, Copy, ExternalLink,
  Loader2, Building2, BadgeCheck, Truck, CircleDot, RefreshCw, Save,
} from 'lucide-react';

// Brend ikonkalari lucide v1 da yo'q — Simple Icons to'plamidan olamiz
import { SiTelegram, SiInstagram, SiYoutube, SiWhatsapp, SiFacebook } from 'react-icons/si';

/** Ichki nom -> ikonka komponenti */
const MAP = {
  // --- Uskuna kategoriyalari (bazadagi iconKey) ---
  uzi: Activity,
  ekg: HeartPulse,
  ivl: Wind,
  defib: Zap,
  sterilizator: Container,
  lab: FlaskConical,
  nasos: Droplets,

  // --- Aloqa ---
  phone: Phone,
  mail: Mail,
  pin: MapPin,
  clock: Clock,

  // --- Navigatsiya ---
  arrow: ArrowRight,
  arrowLeft: ArrowLeft,
  arrowUpRight: ArrowUpRight,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  menu: Menu,
  close: X,
  external: ExternalLink,

  // --- Holat / harakat ---
  check: Check,
  plus: Plus,
  minus: Minus,
  shield: ShieldCheck,
  wrench: Wrench,
  box: Package,
  doc: FileText,
  search: Search,
  globe: Globe,
  spark: Sparkles,
  send: Send,
  trash: Trash2,
  edit: Pencil,
  eye: Eye,
  eyeOff: EyeOff,
  logout: LogOut,
  user: User,
  settings: Settings,
  dashboard: LayoutDashboard,
  inbox: Inbox,
  tags: Tags,
  image: ImageIcon,
  filter: Filter,
  grid: LayoutGrid,
  list: List,
  star: Star,
  warning: AlertTriangle,
  info: Info,
  copy: Copy,
  loader: Loader2,
  company: Building2,
  verified: BadgeCheck,
  truck: Truck,
  dot: CircleDot,
  refresh: RefreshCw,
  save: Save,

  // --- Ijtimoiy tarmoqlar (Simple Icons) ---
  telegram: SiTelegram,
  instagram: SiInstagram,
  youtube: SiYoutube,
  whatsapp: SiWhatsapp,
  facebook: SiFacebook,
  other: Globe,
};

/** react-icons komponentlari strokeWidth qabul qilmaydi */
const BRANDS = new Set(['telegram', 'instagram', 'youtube', 'whatsapp', 'facebook']);

/**
 * @param {{name:string, size?:number, className?:string, strokeWidth?:number}} props
 */
export const Icon = ({ name, size = 20, className, strokeWidth = 1.75, ...rest }) => {
  const Candidate = MAP[name];

  if (!Candidate) {
    console.error("UNKNOWN ICON:", name);
  }

  const Cmp = Candidate || CircleDot;
  if (BRANDS.has(name)) return <Cmp size={size} className={className} aria-hidden {...rest} />;
  return <Cmp size={size} className={className} strokeWidth={strokeWidth} aria-hidden {...rest} />;
};

export default Icon;

// Tez-tez kerak bo'ladiganlarni to'g'ridan-to'g'ri ham eksport qilamiz
export {
  Activity, HeartPulse, Wind, Zap, Container, FlaskConical, Droplets,
  Phone, Mail, MapPin, Clock, ArrowRight, ArrowUpRight, Check, Plus,
  ShieldCheck, Wrench, Package, FileText, Search, Globe, Menu, X, ChevronDown,
  Sparkles, Trash2, Pencil, LogOut, User, Settings, LayoutDashboard, Inbox,
  Tags, Filter, LayoutGrid, List, AlertTriangle, Loader2, BadgeCheck, Truck,
};
