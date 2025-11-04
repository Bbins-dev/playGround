/**
 * Cloudflare Pages Functions Middleware
 * 동적으로 언어별 SEO 메타태그를 주입합니다.
 *
 * 작동 방식:
 * 1. URL 파라미터 ?lang=xx 감지
 * 2. 해당 언어의 메타데이터 로드
 * 3. HTML의 {{MARKER}} 템플릿을 실제 값으로 교체
 * 4. 검색엔진에 언어별 메타태그 제공
 */

import { META_DATA, DEFAULT_LANG, SUPPORTED_LANGS } from './meta-data.js';

/**
 * 모든 HTML 요청을 가로채서 메타태그를 동적으로 주입
 */
export async function onRequest(context) {
    const { request, next, env } = context;
    const url = new URL(request.url);

    // HTML 요청이 아니면 그대로 통과
    const path = url.pathname;
    if (!path.endsWith('.html') && !path.endsWith('/') && path.includes('.')) {
        return next();
    }

    // 언어 파라미터 감지 (?lang=ko, ?lang=en, ?lang=ja)
    const langParam = url.searchParams.get('lang');
    const lang = SUPPORTED_LANGS.includes(langParam) ? langParam : DEFAULT_LANG;

    // 메타데이터 가져오기
    const meta = META_DATA[lang] || META_DATA[DEFAULT_LANG];

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
        .replace(/\{\{TWITTER_TITLE\}\}/g, escapeHtml(meta.twitterTitle))
        .replace(/\{\{TWITTER_DESCRIPTION\}\}/g, escapeHtml(meta.twitterDescription));

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
