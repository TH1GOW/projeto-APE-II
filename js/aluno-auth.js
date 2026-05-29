window.addEventListener('DOMContentLoaded', async () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) {
        const { data: profile } = await supabaseClient
            .from('alunos')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();
        if (profile) {
            window.location.href = 'aluno.html';
        } else {
            await supabaseClient.auth.signOut();
        }
    }
});

window.handleLoginReal = async function(e) { 
    try {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalContent = btn.innerHTML;
        
        btn.innerHTML = '<div class="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';
        btn.disabled = true;

        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            alert('Erro: ' + error.message);
            btn.innerHTML = originalContent;
            btn.disabled = false;
        } else {
            const { data: profile, error: profileError } = await supabaseClient
                .from('alunos')
                .select('id')
                .eq('id', data.user.id)
                .maybeSingle();

            if (profileError || !profile) {
                await supabaseClient.auth.signOut();
                alert('Erro: Esta conta não está cadastrada como Aluno!');
                btn.innerHTML = originalContent;
                btn.disabled = false;
                return;
            }

            window.location.href = 'aluno.html';
            btn.innerHTML = originalContent; 
            btn.disabled = false; 
        } 
    } catch (err) { 
        alert('Erro inesperado: ' + err.message); 
        console.error(err); 
        e.target.querySelector('button').innerHTML = e.target.querySelector('button').getAttribute('data-original') || 'Erro'; 
        e.target.querySelector('button').disabled = false; 
    } 
};

window.handleSignupReal = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalContent = btn.innerHTML;
    try {
        btn.innerHTML = '<div class="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';
        btn.disabled = true;

        const inputsText = e.target.querySelectorAll('input[type="text"]');
        const nome = inputsText[0].value;
        const serie = inputsText[1].value;
        const email = e.target.querySelector('input[type="email"]').value;
        
        let dificuldade = '';
        document.querySelectorAll('.difficulty-card').forEach(radio => {
            if(radio.checked) dificuldade = radio.value;
        });

        const senhas = e.target.querySelectorAll('input[type="password"]');
        const pass1 = senhas[0].value;
        const pass2 = senhas[1].value;

        if (pass1 !== pass2) {
            alert('Erro: As senhas não coincidem!');
            btn.innerHTML = originalContent;
            btn.disabled = false;
            return;
        }

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: pass1,
        });

        if (error) {
            alert('Erro: ' + error.message);
            btn.innerHTML = originalContent;
            btn.disabled = false;
        } else {
            if (data.user) {
                const { error: dbError } = await supabaseClient.from('alunos').insert({
                    id: data.user.id,
                    nome: nome,
                    email: email,
                    serie: serie,
                    dificuldade_principal: dificuldade,
                    senha: pass1
                });
                if (dbError) {
                    console.error("Erro ao criar perfil:", dbError);
                    alert('Erro: Conta criada com sucesso, mas erro ao salvar os dados adicionais no banco: ' + dbError.message);
                    btn.innerHTML = originalContent;
                    btn.disabled = false;
                    return;
                }
            }
            alert('Sua conta foi criada com sucesso. Por favor, faça login.');
            window.location.href = 'loginAluno.html';
            e.target.reset();
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    } catch (err) {
        console.error("Erro inesperado no cadastro:", err);
        alert("Ocorreu um erro inesperado: " + err.message);
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
};
