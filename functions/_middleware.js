/**
 * Cloudflare Pages Functions Middleware (Root)
 * 경로별로 다른 메타태그 처리를 수행합니다.
 *
 * 작동 방식:
 * 1. 경로 감지 (/games/card-battle-game/* vs 기타)
 * 2. 카드게임 경로: 언어별 동적 메타태그 주입
 * 3. 기타 경로: 그대로 통과
 */

import { CARD_GAME_META, DEFAULT_LANG, SUPPORTED_LANGS } from './card-game-meta.js';

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

    // 카드게임 경로가 아니면 그대로 통과
    if (!path.includes('/games/card-battle-game')) {
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
    const meta = CARD_GAME_META[lang] || CARD_GAME_META[DEFAULT_LANG];

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
        .replace(/\{\{KEYWORDS\}\}/g, escapeHtml(meta.keywords))
        .replace(/\{\{OG_TITLE\}\}/g, escapeHtml(meta.ogTitle))
        .replace(/\{\{OG_DESCRIPTION\}\}/g, escapeHtml(meta.ogDescription))
        .replace(/\{\{OG_IMAGE\}\}/g, meta.ogImage)
        .replace(/\{\{TWITTER_TITLE\}\}/g, escapeHtml(meta.twitterTitle))
        .replace(/\{\{TWITTER_DESCRIPTION\}\}/g, escapeHtml(meta.twitterDescription))
        .replace(/\{\{TWITTER_IMAGE\}\}/g, meta.twitterImage);

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
