#!/usr/bin/env node
/**
 * 버전 자동 동기화 스크립트 (Configuration-Driven)
 * package.json을 단일 진실의 원천(Single Source of Truth)으로 사용
 * 버전을 읽어서 gameConfig.js와 index.html에 자동 동기화
 *
 * 사용법: node update-version.js
 */

const fs = require('fs');
const path = require('path');

// Configuration-driven: 경로 설정
const CONFIG = {
    packageJsonPath: path.join(__dirname, 'package.json'),
    gameConfigPath: path.join(__dirname, 'js', 'config', 'gameConfig.js'),
    indexHtmlPath: path.join(__dirname, 'index.html'),
};

/**
 * package.json에서 버전 번호 추출 (단일 진실의 원천)
 */
function extractVersionFromPackageJson(packagePath) {
    try {
        const content = fs.readFileSync(packagePath, 'utf8');
        const packageJson = JSON.parse(content);

        if (!packageJson.version) {
            throw new Error('package.json에 version 필드가 없습니다.');
        }

        return packageJson.version;
    } catch (error) {
        console.error(`❌ package.json 읽기 실패: ${error.message}`);
        process.exit(1);
    }
}

/**
 * gameConfig.js의 버전 정보 업데이트
 */
function updateGameConfig(configPath, version) {
    try {
        let content = fs.readFileSync(configPath, 'utf8');

        // versionInfo.number 값 교체
        const regex = /(number:\s*['"])([^'"]+)(['"])/;
        const replacement = `$1${version}$3`;

        if (!regex.test(content)) {
            throw new Error('gameConfig.js에서 versionInfo.number를 찾을 수 없습니다.');
        }

        const newContent = content.replace(regex, replacement);

        // 변경사항이 있을 때만 파일 쓰기
        if (content !== newContent) {
            fs.writeFileSync(configPath, newContent, 'utf8');
            console.log(`✅ gameConfig.js 업데이트 완료: ${version}`);
            return true;
        } else {
            console.log(`ℹ️  gameConfig.js 버전이 이미 최신 상태입니다: ${version}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ gameConfig.js 업데이트 실패: ${error.message}`);
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

    // 1. package.json에서 버전 추출 (단일 진실의 원천)
    const version = extractVersionFromPackageJson(CONFIG.packageJsonPath);
    console.log(`📦 package.json 버전: ${version}`);

    // 2. gameConfig.js 업데이트
    const configUpdated = updateGameConfig(CONFIG.gameConfigPath, version);

    // 3. index.html 업데이트
    const indexUpdated = updateIndexHtml(CONFIG.indexHtmlPath, version);

    console.log('\n✨ 버전 동기화 완료!');

    if (configUpdated || indexUpdated) {
        console.log('\n💡 Git에 커밋하는 것을 잊지 마세요:');
        const filesToAdd = [];
        if (configUpdated) filesToAdd.push('js/config/gameConfig.js');
        if (indexUpdated) filesToAdd.push('index.html');
        console.log(`   git add ${filesToAdd.join(' ')}`);
        console.log(`   git commit -m "chore: sync version to ${version}"`);
    }
}

// 스크립트 실행
main();
