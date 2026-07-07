export type BusinessType =
  | 'CAFE'
  | 'RESTAURANT'
  | 'BAR'
  | 'BEAUTY'
  | 'NAILS'
  | 'HAIR'
  | 'DRYCLEANING'
  | 'OTHER'

export interface OfferTemplate {
  id: string
  name: string
  icon: string
  niche: BusinessType | 'ALL'
  defaults: {
    title: string
    offerType: string
    benefitType: string
    benefitValue: number
    visibility: string
    redemptionChannel: string
    termsText?: string
  }
}

export const OFFER_TEMPLATES: OfferTemplate[] = [
  // Universal
  {
    id: 'percent-discount',
    name: '%-скидка',
    icon: '🏷',
    niche: 'ALL',
    defaults: {
      title: '-{value}% на всё меню',
      offerType: 'PERCENT_DISCOUNT',
      benefitType: 'PERCENT',
      benefitValue: 20,
      visibility: 'FREE_FOR_ALL',
      redemptionChannel: 'IN_STORE',
    },
  },
  {
    id: 'first-visit',
    name: 'Первый визит',
    icon: '👋',
    niche: 'ALL',
    defaults: {
      title: '-{value}% на первый визит',
      offerType: 'FIRST_VISIT',
      benefitType: 'PERCENT',
      benefitValue: 25,
      visibility: 'FREE_FOR_ALL',
      redemptionChannel: 'IN_STORE',
    },
  },
  // Cafe
  {
    id: 'cafe-happy-hours',
    name: 'Счастливые часы',
    icon: '⏰',
    niche: 'CAFE',
    defaults: {
      title: '-{value}% на напитки с 14:00 до 17:00',
      offerType: 'OFF_PEAK',
      benefitType: 'PERCENT',
      benefitValue: 30,
      visibility: 'MEMBERS_ONLY',
      redemptionChannel: 'IN_STORE',
      termsText: 'Действует с понедельника по пятницу с 14:00 до 17:00. Не суммируется с другими акциями.',
    },
  },
  {
    id: 'cafe-coffee-to-go',
    name: 'Кофе с собой',
    icon: '☕',
    niche: 'CAFE',
    defaults: {
      title: 'Кофе с собой за {value}₽',
      offerType: 'FIXED_PRICE',
      benefitType: 'FIXED_PRICE',
      benefitValue: 199,
      visibility: 'FREE_FOR_ALL',
      redemptionChannel: 'IN_STORE',
      termsText: 'Любой кофе объёмом до 400 мл. Действует ежедневно.',
    },
  },
  // Restaurant
  {
    id: 'restaurant-business-lunch',
    name: 'Бизнес-ланч',
    icon: '🍽',
    niche: 'RESTAURANT',
    defaults: {
      title: 'Бизнес-ланч за {value}₽',
      offerType: 'FIXED_PRICE',
      benefitType: 'FIXED_PRICE',
      benefitValue: 399,
      visibility: 'FREE_FOR_ALL',
      redemptionChannel: 'IN_STORE',
      termsText: 'Пн–Пт с 12:00 до 16:00. Салат + суп + основное + напиток.',
    },
  },
  {
    id: 'restaurant-two-for-one',
    name: '2 по цене 1',
    icon: '🎁',
    niche: 'RESTAURANT',
    defaults: {
      title: '2 по цене 1 на пиццу (экономия {value}%)',
      offerType: 'BUNDLE',
      benefitType: 'BUNDLE',
      benefitValue: 50,
      visibility: 'MEMBERS_ONLY',
      redemptionChannel: 'IN_STORE',
      termsText: 'При заказе двух пицц по меню оплачивается одна.',
    },
  },
  // Bar
  {
    id: 'bar-happy-hours',
    name: 'Happy hours',
    icon: '🍸',
    niche: 'BAR',
    defaults: {
      title: '-{value}% на коктейли с 17:00 до 20:00',
      offerType: 'OFF_PEAK',
      benefitType: 'PERCENT',
      benefitValue: 40,
      visibility: 'MEMBERS_ONLY',
      redemptionChannel: 'IN_STORE',
      termsText: 'Действует ежедневно с 17:00 до 20:00 на весь ассортимент коктейлей.',
    },
  },
  {
    id: 'bar-first-drink',
    name: 'Первый напиток',
    icon: '🥂',
    niche: 'BAR',
    defaults: {
      title: '-{value}% на первый напиток',
      offerType: 'FIRST_VISIT',
      benefitType: 'PERCENT',
      benefitValue: 30,
      visibility: 'FREE_FOR_ALL',
      redemptionChannel: 'IN_STORE',
      termsText: 'Скидка предоставляется при первом посещении заведения.',
    },
  },
  // Beauty / Nails / Hair
  {
    id: 'beauty-first-visit',
    name: 'Первое посещение',
    icon: '💅',
    niche: 'BEAUTY',
    defaults: {
      title: '-{value}% на первое посещение',
      offerType: 'FIRST_VISIT',
      benefitType: 'PERCENT',
      benefitValue: 20,
      visibility: 'FREE_FOR_ALL',
      redemptionChannel: 'IN_STORE',
      termsText: 'Скидка на все услуги при первом посещении.',
    },
  },
  {
    id: 'nails-combo',
    name: 'Комплект маникюр+педикюр',
    icon: '💅',
    niche: 'NAILS',
    defaults: {
      title: 'Маникюр + педикюр за {value}₽',
      offerType: 'FIXED_PRICE',
      benefitType: 'FIXED_PRICE',
      benefitValue: 2490,
      visibility: 'FREE_FOR_ALL',
      redemptionChannel: 'IN_STORE',
      termsText: 'Комплексная услуга включает покрытие гель-лаком. Запись обязательна.',
    },
  },
  {
    id: 'hair-color',
    name: 'Окрашивание',
    icon: '💇',
    niche: 'HAIR',
    defaults: {
      title: '-{value}% на окрашивание',
      offerType: 'PERCENT_DISCOUNT',
      benefitType: 'PERCENT',
      benefitValue: 25,
      visibility: 'FREE_FOR_ALL',
      redemptionChannel: 'IN_STORE',
      termsText: 'Скидка на окрашивание любой сложности. Предварительная запись.',
    },
  },
  // Dry cleaning
  {
    id: 'drycleaning-fixed-amount',
    name: 'Скидка на химчистку',
    icon: '👔',
    niche: 'DRYCLEANING',
    defaults: {
      title: 'Скидка {value}₽ на химчистку',
      offerType: 'PERCENT_DISCOUNT',
      benefitType: 'FIXED_AMOUNT',
      benefitValue: 500,
      visibility: 'FREE_FOR_ALL',
      redemptionChannel: 'IN_STORE',
      termsText: 'Скидка действует на заказы от 1500₽.',
    },
  },
]
