const fs = require('fs');

function extractFile(sourceFile, type) {
    const content = fs.readFileSync(sourceFile, 'utf8');
    
    // Extract head, auth-container, app-wrapper, script
    const headMatch = content.match(/(<head>[\s\S]*?<\/head>)/);
    const authMatch = content.match(/(<div id="auth-container"[\s\S]*?)<!-- MAIN APP WRAPPER -->/);
    const appMatch = content.match(/(<div id="app-wrapper"[\s\S]*?)<script>/);
    const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);

    if (!headMatch || !authMatch || !appMatch || !scriptMatch) {
        console.error(`Failed to parse ${sourceFile}`);
        return;
    }

    let head = headMatch[1];
    let auth = authMatch[1];
    let app = appMatch[1];
    let script = scriptMatch[1];

    // Clean head: remove old style, add css and js
    head = head.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="css/style.css">');

    // For auth, extract header, login card, signup card
    const loginMatch = auth.match(/(<!-- Card de Login -->[\s\S]*?)(?=<!-- Card de Cadastro -->)/);
    const signupMatch = auth.match(/(<!-- Card de Cadastro -->[\s\S]*?)(?=<\/div>\s*<\/div>\s*$)/);
    const authHeaderMatch = auth.match(/(<div class="text-center[\s\S]*?)(?=<!-- Card de Login -->)/);

    let authHeader = authHeaderMatch ? authHeaderMatch[1] : '';
    let loginCard = loginMatch ? loginMatch[1] : '';
    let signupCard = signupMatch ? signupMatch[1] : '';

    // Modify links in cards
    loginCard = loginCard.replace(/<button type="button" onclick="toggleAuth\('signup'\)".*?>Cadastre-se grátis<\/button>/g, `<a href="cadastro${type}.html" class="text-sky-600 hover:underline inline-block">Cadastre-se grátis</a>`);
    loginCard = loginCard.replace(/<button type="button" onclick="toggleAuth\('signup'\)".*?>Crie a sua conta de voluntário<\/button>/g, `<a href="cadastro${type}.html" class="text-blue-600 hover:underline inline-block">Crie a sua conta de voluntário</a>`);
    
    signupCard = signupCard.replace(/<button type="button" onclick="toggleAuth\('login'\)".*?>Entre aqui<\/button>/g, `<a href="login${type}.html" class="text-sky-600 hover:underline inline-block">Entre aqui</a>`);
    signupCard = signupCard.replace(/<button type="button" onclick="toggleAuth\('login'\)".*?>Inicie sessão<\/button>/g, `<a href="login${type}.html" class="text-blue-600 hover:underline inline-block">Inicie sessão</a>`);

    // Remove hidden-section
    loginCard = loginCard.replace(/hidden-section/g, '');
    signupCard = signupCard.replace(/hidden-section/g, '');
    app = app.replace(/hidden-section/g, '');

    const baseHtml = `<!DOCTYPE html>
<html lang="pt-br">
${head}
<body class="bg-[#F1F5F9] text-[#1E293B] h-screen flex overflow-hidden">
    {{BODY}}
    <script src="js/supabase.js"></script>
    <script src="js/{{JS_FILE}}.js"></script>
</body>
</html>`;

    const authContainerStart = `<div id="auth-container" class="fixed inset-0 z-[100] login-gradient flex items-center justify-center p-4 overflow-y-auto">\n        <div class="w-full max-w-lg my-auto">\n${authHeader}`;
    const authContainerEnd = `\n        </div>\n    </div>`;

    // Write Login HTML
    fs.writeFileSync(`login${type}.html`, baseHtml.replace('{{BODY}}', authContainerStart + loginCard + authContainerEnd).replace('{{JS_FILE}}', `${type.toLowerCase()}-auth`));

    // Write Signup HTML
    fs.writeFileSync(`cadastro${type}.html`, baseHtml.replace('{{BODY}}', authContainerStart + signupCard + authContainerEnd).replace('{{JS_FILE}}', `${type.toLowerCase()}-auth`));

    // Write Dashboard HTML
    fs.writeFileSync(`${type.toLowerCase()}.html`, baseHtml.replace('{{BODY}}', app).replace('{{JS_FILE}}', `${type.toLowerCase()}`));

    // Now process JavaScript
    // Remove supabase init
    script = script.replace(/\/\/ --- SUPABASE INICIALIZAÇÃO ---[\s\S]*?const supabase = window.supabase.createClient.*?;\n/g, '');
    
    // Remove toggleAuth
    script = script.replace(/window\.toggleAuth = function\([\s\S]*?};\n/g, '');

    // Replace toggleAuth calls inside handleLoginReal/handleSignupReal
    script = script.replace(/toggleAuth\('login'\);/g, `window.location.href = 'login${type}.html';`);

    // We need to separate auth logic from dashboard logic
    const authLogic = [];
    const dashboardLogic = [];

    const lines = script.split('\n');
    let inAuthFunc = false;
    let authBraces = 0;
    
    // Simplified split: just put handleLoginReal, handleSignupReal, etc. in auth
    const authRegex = /async function (handleLoginReal|handleSignupReal)/;
    
    // Actually, instead of parsing, let's just create specialized scripts manually, it's safer.
    // Or just put all functions in both, and let them be unused where not needed.
    // Wait, the DOMContentLoaded logic is different!
    
    // Auth DOMContentLoaded:
    const authOnLoad = `
        window.addEventListener('DOMContentLoaded', async () => {
            if (typeof lucide !== 'undefined') lucide.createIcons();
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
                window.location.href = '${type.toLowerCase()}.html';
            }
        });
    `;

    // Dashboard DOMContentLoaded:
    const dashOnLoad = `
        window.addEventListener('DOMContentLoaded', async () => {
            if (typeof lucide !== 'undefined') lucide.createIcons();
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
                await carregarDadosUsuario(session.user);
                // Also check if type matches? Not strictly needed for now
                if (typeof carregarAulas === 'function') await carregarAulas();
                if (typeof renderizarAgenda === 'function') await renderizarAgenda();
            } else {
                window.location.href = 'login${type}.html';
            }
        });
    `;

    // Extract handleLoginReal and handleSignupReal
    const loginFuncMatch = script.match(/(async function handleLoginReal[\s\S]*?\n        })/);
    const signupFuncMatch = script.match(/(async function handleSignupReal[\s\S]*?\n        })/);

    const loginFunc = loginFuncMatch ? loginFuncMatch[1] : '';
    const signupFunc = signupFuncMatch ? signupFuncMatch[1] : '';

    // Modify redirect inside them
    const fixedLoginFunc = loginFunc.replace(/document\.getElementById\('auth-container'\).*?\n.*?app-wrapper.*?\n.*?lucide\.createIcons\(\);(\n.*?await carregarAulas\(\);|\n.*?await renderizarAgenda\(\);)*/gs, `window.location.href = '${type.toLowerCase()}.html';`);
    const fixedSignupFunc = signupFunc.replace(/document\.getElementById\('auth-container'\).*?\n.*?app-wrapper.*?\n.*?lucide\.createIcons\(\);(\n.*?await carregarAulas\(\);|\n.*?await renderizarAgenda\(\);)*/gs, `window.location.href = '${type.toLowerCase()}.html';`);

    const authJs = authOnLoad + '\n' + fixedLoginFunc + '\n' + fixedSignupFunc;
    fs.writeFileSync(`js/${type.toLowerCase()}-auth.js`, authJs);

    // Dashboard JS: everything else but with new DOMContentLoaded
    let dashJs = script.replace(/window\.addEventListener\('DOMContentLoaded'[\s\S]*?}\);/g, dashOnLoad);
    dashJs = dashJs.replace(/async function verificarSessao[\s\S]*?}\n\s*}/g, ''); // Remove verificarSessao since it's in DOMContentLoaded now
    dashJs = dashJs.replace(/async function handleLoginReal[\s\S]*?\n        }/g, '');
    dashJs = dashJs.replace(/async function handleSignupReal[\s\S]*?\n        }/g, '');
    
    // Modify logout to redirect
    dashJs = dashJs.replace(/document\.getElementById\('auth-container'\).*?\n.*?app-wrapper.*?\n.*?toggleAuth\('login'\);/gs, `window.location.href = 'login${type}.html';`);

    fs.writeFileSync(`js/${type.toLowerCase()}.js`, dashJs);
}

extractFile('aluno.html', 'Aluno');
extractFile('voluntario.html', 'Voluntario');
