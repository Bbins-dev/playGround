#!/usr/bin/env node
/**
 * 버전 자동 동기화 스크립트
 * gameConfig.js의 버전을 읽어서 index.html의 캐시 버스팅 쿼리 스트링 자동 업데이트
 *
 * 사용법: node update-version.js
 */

const fs = require('fs');
const path = require('path');

// Configuration-driven: 경로 설정
const CONFIG = {
    gameConfigPath: path.join(__dirname, 'js', 'config', 'gameConfig.js'),
    indexHtmlPath: path.join(__dirname, 'index.html'),
};

/**
 * gameConfig.js에서 버전 번호 추출
 */
function extractVersionFromConfig(configPath) {
    try {
        const content = fs.readFileSync(configPath, 'utf8');
        // versionInfo.number 값 찾기 (정규식 사용)
        const match = content.match(/number:\s*['"]([^'"]+)['"]/);

        if (match && match[1]) {
            return match[1];
        }

        throw new Error('버전 번호를 찾을 수 없습니다.');
    } catch (error) {
        console.error(`❌ gameConfig.js 읽기 실패: ${error.message}`);
        process.exit(1);
    }
}

/**
 * index.html의 캐시 버스팅 쿼리 스트링 업데이트
 */
function updateIndexHtml(indexPath, version) {
    try {
        let content = fs.readFileSync(indexPath, 'utf8');

        // gameConfig.js의 버전 쿼리 스트링 교체
        const regex = /(<script src="js\/config\/gameConfig\.js\?v=)[^"]+(")/;
        const replacement = `$1${version}$2`;

        if (!regex.test(content)) {
            throw new Error('gameConfig.js 스크립트 태그를 찾을 수 없습니다.');
        }

        const newContent = content.replace(regex, replacement);

        // 변경사항이 있을 때만 파일 쓰기
        if (content !== newContent) {
            fs.writeFileSync(indexPath, newContent, 'utf8');
            console.log(`✅ index.html 업데이트 완료: v=${version}`);
            return true;
        } else {
            console.log(`ℹ️  버전이 이미 최신 상태입니다: v=${version}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ index.html 업데이트 실패: ${error.message}`);
        process.exit(1);
    }
}

/**
 * 메인 실행 함수
 */
function main() {
    console.log('🔧 버전 동기화 시작...\n');

    // 1. gameConfig.js에서 버전 추출
    const version = extractVersionFromConfig(CONFIG.gameConfigPath);
    console.log(`📦 현재 게임 버전: ${version}`);

    // 2. index.html 업데이트
    const updated = updateIndexHtml(CONFIG.indexHtmlPath, version);

    console.log('\n✨ 버전 동기화 완료!');

    if (updated) {
        console.log('\n💡 Git에 커밋하는 것을 잊지 마세요:');
        console.log('   git add index.html');
        console.log(`   git commit -m "chore: sync cache-busting version to ${version}"`);
    }
}

// 스크립트 실행
main();
