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
 * index.html의 모든 로컬 JS/CSS 파일에 캐시 버스팅 적용
 */
function updateIndexHtml(indexPath, version) {
    try {
        let content = fs.readFileSync(indexPath, 'utf8');
        let updateCount = 0;

        // 1. 프로젝트 JS 파일에 캐시 버스팅 추가/업데이트
        // 패턴: <script src="*.js"> 또는 <script src="js/.../*.js"> 또는 <script src="*.js?v=기존버전">
        // game.js와 js/ 디렉토리 안의 모든 JS 파일 포함
        const jsRegex = /(<script src=")([^"]+\.js)(\?v=[^"]+)?(")/g;
        const newContent1 = content.replace(jsRegex, (match, p1, p2, p3, p4) => {
            // 외부 URL 제외 (https://, http://)
            if (p2.startsWith('http://') || p2.startsWith('https://')) {
                return match;
            }
            updateCount++;
            return `${p1}${p2}?v=${version}${p4}`;
        });

        // 2. 프로젝트 CSS 파일에 캐시 버스팅 추가/업데이트
        // 패턴: <link rel="stylesheet" href="*.css"> 또는 <link rel="stylesheet" href="*.css?v=기존버전">
        const cssRegex = /(<link rel="stylesheet" href=")([^"]+\.css)(\?v=[^"]+)?(")/g;
        const newContent2 = newContent1.replace(cssRegex, (match, p1, p2, p3, p4) => {
            // 외부 URL 제외
            if (p2.startsWith('http://') || p2.startsWith('https://')) {
                return match;
            }
            updateCount++;
            return `${p1}${p2}?v=${version}${p4}`;
        });

        // 변경사항이 있을 때만 파일 쓰기
        if (content !== newContent2) {
            fs.writeFileSync(indexPath, newContent2, 'utf8');
            console.log(`✅ index.html 업데이트 완료: ${updateCount}개 파일에 v=${version} 적용`);
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
 * .env 파일 로드 (dotenv 없이 직접 파싱)
 */
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) {
            return {};
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};

        envContent.split('\n').forEach(line => {
            // 주석 제거 및 빈 줄 건너뛰기
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                return;
            }

            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length) {
                env[key.trim()] = valueParts.join('=').trim();
            }
        });

        return env;
    } catch (error) {
        return {};
    }
}

/**
 * Supabase app_version 테이블 자동 업데이트
 */
async function updateSupabaseVersion(version) {
    const env = loadEnv();
    const serviceKey = env.SUPABASE_SERVICE_KEY;
    const supabaseUrl = env.SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
        console.error('\n❌ Supabase 환경변수 누락 (.env 파일에 SUPABASE_URL, SUPABASE_SERVICE_KEY 필수)');
        console.error('   .env.example 파일을 참고하여 .env 파일을 생성하세요.');
        console.error(`   수동 업데이트: UPDATE app_version SET version = '${version}';`);
        return false;
    }

    try {
        const url = `${supabaseUrl}/rest/v1/app_version?id=eq.1`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                version: version,
                updated_at: new Date().toISOString()
            })
        });

        if (response.ok) {
            console.log(`\n✅ Supabase app_version 자동 업데이트 완료: ${version}`);
            return true;
        } else {
            const errorText = await response.text();
            console.error(`\n❌ Supabase 업데이트 실패 (HTTP ${response.status}): ${errorText}`);
            console.log(`   수동으로 Supabase에서 업데이트하세요: UPDATE app_version SET version = '${version}';`);
            return false;
        }
    } catch (error) {
        console.error(`\n❌ Supabase 업데이트 중 오류 발생: ${error.message}`);
        console.log(`   수동으로 Supabase에서 업데이트하세요: UPDATE app_version SET version = '${version}';`);
        return false;
    }
}

/**
 * 메인 실행 함수
 */
async function main() {
    console.log('🔧 버전 동기화 시작...\n');

    // 1. package.json에서 버전 추출 (단일 진실의 원천)
    const version = extractVersionFromPackageJson(CONFIG.packageJsonPath);
    console.log(`📦 package.json 버전: ${version}`);

    // 2. gameConfig.js 업데이트
    const configUpdated = updateGameConfig(CONFIG.gameConfigPath, version);

    // 3. index.html 업데이트
    const indexUpdated = updateIndexHtml(CONFIG.indexHtmlPath, version);

    // 4. Supabase app_version 테이블 자동 업데이트
    const supabaseUpdated = await updateSupabaseVersion(version);

    // SSOT 파이프라인: Supabase 실패 시 전체 중단 (DB 불일치 방지)
    if (!supabaseUpdated) {
        console.error('\n🚨 버전 동기화 실패: Supabase DB 업데이트가 완료되지 않았습니다.');
        console.error('   코드와 DB 버전 불일치 시 VersionChecker가 무한 새로고침을 유발합니다.');
        console.error('   .env 설정 확인 후 다시 시도하세요.');
        process.exit(1);
    }

    console.log('\n✨ 버전 동기화 완료! (package.json → gameConfig.js → index.html → Supabase DB)');

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
