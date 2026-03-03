/**
 * Cloudflare Pages Functions Middleware (Root)
 * 경로별로 다른 메타태그 처리를 수행합니다.
 *
 * 작동 방식:
 * 1. 정적 파일 → Cache-Control 헤더 추가
 * 2. 홈페이지 (/) → 언어별 동적 메타태그 주입
 * 3. 카드게임 (/games/card-battle-game/*) → 언어별 동적 메타태그 주입
 * 4. 기타 경로 → 그대로 통과
 */

import { CARD_GAME_META, DEFAULT_LANG, SUPPORTED_LANGS } from './card-game-meta.js';
import { HOMEPAGE_META } from './homepage-meta.js';

/**
 * 경로에 해당하는 메타데이터 소스를 반환
 * @param {string} path - URL pathname
 * @returns {{ metaSource: object, baseUrl: string } | null}
 */
function getMetaSource(path) {
    if (path === '/' || path === '/index.html') {
        return { metaSource: HOMEPAGE_META, baseUrl: 'https://binboxgames.com/' };
    }
    if (path.includes('/games/card-battle-game')) {
        return { metaSource: CARD_GAME_META, baseUrl: 'https://binboxgames.com/games/card-battle-game/' };
    }
    return null;
}

/**
 * 모든 요청을 가로채서 경로별 처리
 */
export async function onRequest(context) {
    const { request, next } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // 정적 파일인 경우 Cache-Control 헤더 추가
    const staticFileExtensions = /\.(css|js|png|jpg|jpeg|svg|woff2?|ttf|mp3|ogg|wav)$/i;
    if (staticFileExtensions.test(path)) {
        const response = await next();
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
        });
    }

    // 메타데이터 소스 확인
    const route = getMetaSource(path);
    if (!route) {
        return next();
    }

    // HTML 요청이 아니면 그대로 통과
    if (!path.endsWith('.html') && !path.endsWith('/') && path.includes('.')) {
        return next();
    }

    // 언어 파라미터 감지 (?lang=ko, ?lang=en, ?lang=ja)
    const langParam = url.searchParams.get('lang');
    const lang = SUPPORTED_LANGS.includes(langParam) ? langParam : DEFAULT_LANG;

    // 메타데이터 가져오기
    const meta = route.metaSource[lang] || route.metaSource[DEFAULT_LANG];

    // Canonical URL 생성 (기본 언어는 쿼리 없는 URL, 다른 언어는 ?lang= 포함)
    const canonicalUrl = (lang === DEFAULT_LANG)
        ? route.baseUrl
        : `${route.baseUrl}?lang=${lang}`;

    // 원본 HTML 응답 가져오기
    const response = await next();

    // HTML이 아니면 그대로 반환
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('text/html')) {
        return response;
    }

    // HTML 텍스트 읽기
    let html = await response.text();

    // 템플릿 마커를 실제 값으로 교체
    html = html
        .replace(/\{\{LANG\}\}/g, meta.lang)
        .replace(/\{\{PAGE_TITLE\}\}/g, escapeHtml(meta.pageTitle))
        .replace(/\{\{DESCRIPTION\}\}/g, escapeHtml(meta.description))
        .replace(/\{\{CANONICAL_URL\}\}/g, canonicalUrl)
        .replace(/\{\{OG_TITLE\}\}/g, escapeHtml(meta.ogTitle))
        .replace(/\{\{OG_DESCRIPTION\}\}/g, escapeHtml(meta.ogDescription))
        .replace(/\{\{TWITTER_TITLE\}\}/g, escapeHtml(meta.twitterTitle))
        .replace(/\{\{TWITTER_DESCRIPTION\}\}/g, escapeHtml(meta.twitterDescription));

    // 카드게임 전용 마커 (홈페이지에는 없으므로 안전하게 처리)
    if (meta.keywords) {
        html = html.replace(/\{\{KEYWORDS\}\}/g, escapeHtml(meta.keywords));
    }
    if (meta.ogImage) {
        html = html.replace(/\{\{OG_IMAGE\}\}/g, meta.ogImage);
    }
    if (meta.twitterImage) {
        html = html.replace(/\{\{TWITTER_IMAGE\}\}/g, meta.twitterImage);
    }

    // 새로운 응답 생성
    return new Response(html, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
    });
}

/**
 * HTML 이스케이프 (XSS 방지)
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
