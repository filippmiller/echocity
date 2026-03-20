/**
 * EchoCity (ГдеСейчас) Telegram Bot — MVP
 *
 * Standalone long-polling bot for the Russian deals platform.
 * Run: npm run bot
 */

import { Bot, InlineKeyboard, InlineQueryResultBuilder } from "grammy";
import { PrismaClient } from "@prisma/client";

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN не задан. Добавьте его в переменные окружения.");
  process.exit(1);
}

const SITE = "https://echocity.filippmiller.com";
const prisma = new PrismaClient();
const bot = new Bot(BOT_TOKEN);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function discountBadge(benefitType: string, benefitValue: number): string {
  switch (benefitType) {
    case "PERCENT":
      return `−${benefitValue}%`;
    case "FIXED_AMOUNT":
      return `−${benefitValue}₽`;
    case "FIXED_PRICE":
      return `${benefitValue}₽`;
    case "FREE_ITEM":
      return "Бесплатно";
    case "BUNDLE":
      return "Комплект";
    default:
      return "";
  }
}

async function fetchActiveOffers(take: number, search?: string) {
  return prisma.offer.findMany({
    where: {
      lifecycleStatus: "ACTIVE",
      approvalStatus: "APPROVED",
      ...(search
        ? { title: { contains: search, mode: "insensitive" as const } }
        : {}),
    },
    include: { branch: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

function offerLine(o: Awaited<ReturnType<typeof fetchActiveOffers>>[number]) {
  const badge = discountBadge(o.benefitType, Number(o.benefitValue));
  const branch = o.branch?.title ?? "";
  return `🏷 <b>${o.title}</b>  ${badge}\n📍 ${branch}\n🔗 ${SITE}/offers/${o.id}`;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .url("Все скидки", `${SITE}/offers`)
    .row()
    .url("Подписка", `${SITE}/subscription`)
    .row()
    .url("Для бизнеса", `${SITE}/for-businesses`);

  await ctx.reply(
    "Добро пожаловать в <b>ГдеСейчас</b>! 🎉\n\nСкидки в лучших заведениях Санкт-Петербурга.",
    { parse_mode: "HTML", reply_markup: keyboard },
  );
});

bot.command("deals", async (ctx) => {
  try {
    const offers = await fetchActiveOffers(3);
    if (offers.length === 0) {
      await ctx.reply("Сейчас нет активных предложений. Загляните позже!");
      return;
    }
    const text = offers.map(offerLine).join("\n\n");
    await ctx.reply(text, { parse_mode: "HTML" });
  } catch (err) {
    console.error("Ошибка при получении скидок:", err);
    await ctx.reply("Произошла ошибка. Попробуйте позже.");
  }
});

bot.command("subscribe", async (ctx) => {
  const keyboard = new InlineKeyboard().url(
    "Оформить подписку",
    `${SITE}/subscription`,
  );
  await ctx.reply(
    "💎 <b>Подписка Plus</b> — от 199₽/мес\n\n7 дней бесплатно. Доступ ко всем эксклюзивным скидкам.",
    { parse_mode: "HTML", reply_markup: keyboard },
  );
});

// ---------------------------------------------------------------------------
// Inline mode
// ---------------------------------------------------------------------------

bot.on("inline_query", async (ctx) => {
  try {
    const query = ctx.inlineQuery.query.trim();
    const offers = await fetchActiveOffers(5, query || undefined);

    const results = offers.map((o) => {
      const desc = `${discountBadge(o.benefitType, Number(o.benefitValue))} — ${o.branch?.title ?? ""}`;
      return InlineQueryResultBuilder.article(o.id, o.title, {
        description: desc,
        url: `${SITE}/offers/${o.id}`,
      }).text(offerLine(o), { parse_mode: "HTML" });
    });

    await ctx.answerInlineQuery(results, { cache_time: 60 });
  } catch (err) {
    console.error("Ошибка inline-запроса:", err);
    await ctx.answerInlineQuery([]);
  }
});

// ---------------------------------------------------------------------------
// Startup & shutdown
// ---------------------------------------------------------------------------

async function shutdown(signal: string) {
  console.log(`\n${signal} получен. Завершение…`);
  bot.stop();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

bot.catch((err) => {
  console.error("Необработанная ошибка бота:", err);
});

console.log("🤖 ГдеСейчас бот запущен (long polling)…");
bot.start();
