// 언어별 SEO 메타데이터
// Cloudflare Workers에서 동적으로 주입됨

export const META_DATA = {
    ko: {
        lang: 'ko',
        pageTitle: '자동전투 카드대전 - BinBox Games',
        description: '자동전투 카드대전! 전략적 덱 빌딩으로 60 스테이지를 클리어하세요. 불, 물, 전기, 독, 노멀 5가지 속성의 브라우저 카드 배틀 게임.',
        keywords: '자동전투 카드대전, 자동전투카드대전, 자동전투 카드게임, 자동전투카드게임, 카드게임, 덱빌딩, 브라우저게임, 자동전투, 전략게임, 카드배틀',
        ogTitle: '자동전투 카드대전 - 5속성 자동배틀 카드 게임',
        ogDescription: '자동전투 카드대전! 전략적 덱 빌딩으로 60 스테이지를 클리어하세요. 불, 물, 전기, 독, 노멀 5가지 속성의 브라우저 카드 배틀 게임.',
        ogImage: 'https://binboxgames.com/games/card-battle-game/images/og-ko.png',
        twitterTitle: '자동전투 카드대전 - 5속성 자동배틀 카드 게임',
        twitterDescription: '자동전투 카드대전! 전략적 덱 빌딩으로 60 스테이지를 클리어하세요. 불, 물, 전기, 독, 노멀 5가지 속성의 브라우저 카드 배틀 게임.',
        twitterImage: 'https://binboxgames.com/games/card-battle-game/images/og-ko.png'
    },
    en: {
        lang: 'en',
        pageTitle: 'Auto Battle Card Dual - BinBox Games',
        description: 'Auto Battle Card Dual! Clear 60 stages with strategic deck building. Browser card battle game with 5 elements: Fire, Water, Electric, Poison, and Normal.',
        keywords: 'Auto Battle Card Dual, Autobattle Card Dual, Auto Battle Cardgame, Autobattle Cardgame, card game, deck building, browser game, auto battle, strategy game, card battle',
        ogTitle: 'Auto Battle Card Dual - 5-Element Auto Battle Card Game',
        ogDescription: 'Auto Battle Card Dual! Clear 60 stages with strategic deck building. Browser card battle game with 5 elements: Fire, Water, Electric, Poison, and Normal.',
        ogImage: 'https://binboxgames.com/games/card-battle-game/images/og-en.png',
        twitterTitle: 'Auto Battle Card Dual - 5-Element Auto Battle Card Game',
        twitterDescription: 'Auto Battle Card Dual! Clear 60 stages with strategic deck building. Browser card battle game with 5 elements: Fire, Water, Electric, Poison, and Normal.',
        twitterImage: 'https://binboxgames.com/games/card-battle-game/images/og-en.png'
    },
    ja: {
        lang: 'ja',
        pageTitle: 'オートバトルカード対戦 - BinBox Games',
        description: 'オートバトルカード対戦！戦略的なデッキ構成で60ステージをクリアしよう。火、水、電気、毒、ノーマルの5つの属性で戦うブラウザカードゲーム。',
        keywords: 'オートバトルカード対戦, オートバトルカードゲーム, オートバトル カード対戦, カードゲーム, デッキ構築, ブラウザゲーム, オートバトル, 戦略ゲーム, カードバトル',
        ogTitle: 'オートバトルカード対戦 - 5属性オートバトルカードゲーム',
        ogDescription: 'オートバトルカード対戦！戦略的なデッキ構成で60ステージをクリアしよう。火、水、電気、毒、ノーマルの5つの属性で戦うブラウザカードゲーム。',
        ogImage: 'https://binboxgames.com/games/card-battle-game/images/og-ja.png',
        twitterTitle: 'オートバトルカード対戦 - 5属性オートバトルカードゲーム',
        twitterDescription: 'オートバトルカード対戦！戦略的なデッキ構成で60ステージをクリアしよう。火、水、電気、毒、ノーマルの5つの属性で戦うブラウザカードゲーム。',
        twitterImage: 'https://binboxgames.com/games/card-battle-game/images/og-ja.png'
    }
};

// 기본 언어
export const DEFAULT_LANG = 'ko';

// 지원 언어 목록
export const SUPPORTED_LANGS = ['ko', 'en', 'ja'];
