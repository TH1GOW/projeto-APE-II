
                // ------------------------------

        // Verificar sessão ao carregar a página
        
        window.addEventListener('DOMContentLoaded', async () => {
            if (typeof lucide !== 'undefined') lucide.createIcons();
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && session.user) {
                await carregarDadosUsuario(session.user);
                // Also check if type matches? Not strictly needed for now
                if (typeof carregarAulas === 'function') await carregarAulas();
                if (typeof renderizarAgenda === 'function') await renderizarAgenda();
            } else {
                window.location.href = 'loginVoluntario.html';
            }
        });
    

        

        async function carregarDadosUsuario(user) {
            // Buscar dados do perfil
            const { data: perfil, error } = await supabaseClient
                .from('voluntarios')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error("Erro ao carregar perfil:", error);
            }

            const nomeExibicao = perfil?.nome || user.email.split('@')[0];
            const disciplina = perfil?.formacao || 'Matemática';

            // Atualizar elementos da UI
            const headerName = document.getElementById('header-username');
            if (headerName) headerName.innerText = `Prof. ${nomeExibicao}`;

            const headerAvatar = document.getElementById('header-avatar');
            if (headerAvatar) headerAvatar.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nomeExibicao)}`;

            const welcomeText = document.getElementById('dashboard-welcome');
            if (welcomeText) welcomeText.innerText = `Olá, ${nomeExibicao.split(' ')[0]}! 👋`;

            // Preencher form de perfil
            const perfilNomeInput = document.getElementById('perfil-nome');
            if (perfilNomeInput) perfilNomeInput.value = nomeExibicao;

            const perfilEmailInput = document.getElementById('perfil-email');
            if (perfilEmailInput) perfilEmailInput.value = user.email;

            const perfilDiffSelect = document.getElementById('perfil-disciplina');
            if (perfilDiffSelect) perfilDiffSelect.value = disciplina;

            const perfilNomeTitulo = document.getElementById('perfil-nome-titulo');
            if (perfilNomeTitulo) perfilNomeTitulo.innerText = `Prof. ${nomeExibicao}`;

            const perfilFoto = document.getElementById('perfil-foto');
            if (perfilFoto) perfilFoto.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nomeExibicao)}`;

            // Ocultar auth-container apenas se ele existir (previne TypeError)
            const authCont = document.getElementById('auth-container');
            if (authCont) authCont.classList.add('hidden-section');
            const appWrap = document.getElementById('app-wrapper');
            if (appWrap) appWrap.classList.remove('hidden-section');
            lucide.createIcons();

            // Carregar agenda
            await renderizarAgenda();
        }

        // Alternar entre Login e Cadastro
                // Lógica de Login/Cadastro
        

        

        // Logout
        async function handleLogout() {
            try {
                await supabaseClient.auth.signOut();
            } catch(e) {
                console.error("Logout falhou", e);
            } finally {
                window.location.href = 'loginVoluntario.html';
            }
        }

        // Navegação de Seções
        function showSection(sectionId) {
            document.getElementById('section-dashboard').classList.add('hidden-section');
            document.getElementById('section-cadastrar-aula').classList.add('hidden-section');
            document.getElementById('section-agenda').classList.add('hidden-section');
            document.getElementById('section-quiz').classList.add('hidden-section');
            document.getElementById('section-material').classList.add('hidden-section');
            document.getElementById('section-perfil').classList.add('hidden-section');
            
            document.getElementById('section-' + sectionId).classList.remove('hidden-section');
            
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active-nav'));
            document.querySelectorAll('.nav-item').forEach(i => {
                if(i.id === 'nav-' + sectionId) i.classList.add('active-nav');
            });

            if(sectionId === 'agenda') renderizarAgenda();
            
            lucide.createIcons();
        }

        // --- LÓGICA DE GESTÃO DE AULAS ---
        async function handleSalvarAula(e) {
            e.preventDefault();
            
            const btn = e.target.querySelector('button[type="submit"]');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<div class="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';
            btn.disabled = true;

            const { data: userData, error: authError } = await supabaseClient.auth.getUser();
            if(authError || !userData?.user) {
                showSuccessModal("Erro de autenticação.");
                btn.innerHTML = originalContent;
                btn.disabled = false;
                return;
            }

            const novaAula = {
                materia: document.getElementById('aula-materia').value,
                titulo: document.getElementById('aula-titulo').value,
                data: document.getElementById('aula-data').value,
                inicio: document.getElementById('aula-inicio').value,
                fim: document.getElementById('aula-fim').value,
                meet_url: document.getElementById('aula-meet').value,
                descricao: document.getElementById('aula-descricao').value,
                voluntario_id: userData.user.id
            };

            const { data, error } = await supabaseClient.from('aulas').insert(novaAula);

            if (error) {
                showSuccessModal("Erro ao salvar: " + error.message);
            } else {
                showSuccessModal("Aula agendada com sucesso! Ela já aparece na sua agenda pedagógica.");
                e.target.reset();
                renderizarAgenda();
            }
            
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }

        async function renderizarAgenda() {
            const container = document.getElementById('lista-aulas-container');
            container.innerHTML = '<div class="text-center py-10"><div class="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto"></div></div>';

            const { data: userData } = await supabaseClient.auth.getUser();
            if (!userData?.user) return;

            const { data: aulas, error } = await supabaseClient
                .from('aulas')
                .select('*')
                .eq('voluntario_id', userData.user.id)
                .order('data', { ascending: true });

            if (error || !aulas || aulas.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-20 bg-white rounded-[2.5rem] border border-dashed">
                        <p class="text-slate-400 font-medium">Nenhuma aula agendada no momento.</p>
                    </div>
                `;
                document.getElementById('stat-classes').innerText = "0";
                return;
            }

            document.getElementById('stat-classes').innerText = aulas.length;

            container.innerHTML = aulas.map(aula => `
                <div class="class-card p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                    <div class="flex items-center gap-4">
                        <div class="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <i data-lucide="${getIconForMateria(aula.materia)}" size="24"></i>
                        </div>
                        <div>
                            <span class="text-[10px] font-black uppercase text-blue-600 tracking-widest">${aula.materia}</span>
                            <h4 class="font-bold text-slate-900">${aula.titulo}</h4>
                            <div class="flex gap-3 mt-1">
                                <span class="text-xs text-slate-500 flex items-center gap-1"><i data-lucide="calendar" size="12"></i> ${formatarData(aula.data)}</span>
                                <span class="text-xs text-slate-500 flex items-center gap-1"><i data-lucide="clock" size="12"></i> ${aula.inicio} - ${aula.fim}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <a href="${aula.meet_url}" target="_blank" class="flex-1 md:flex-none text-center bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
                            ACESSAR MEET
                        </a>
                        <button onclick="removerAula('${aula.id}')" class="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all">
                            <i data-lucide="trash-2" size="20"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            
            lucide.createIcons();
        }

        async function removerAula(id) {
            const { error } = await supabaseClient.from('aulas').delete().eq('id', id);
            if(error) {
                showSuccessModal("Erro ao deletar: " + error.message);
            } else {
                renderizarAgenda();
            }
        }

        function getIconForMateria(materia) {
            const map = {
                'Matemática': 'calculator',
                'Português': 'languages',
                'Inglês': 'globe',
                'História': 'landmark',
                'Redação': 'pen-tool'
            };
            return map[materia] || 'book-open';
        }

        function formatarData(dataStr) {
            const [ano, mes, dia] = dataStr.split('-');
            return `${dia}/${mes}/${ano}`;
        }

        // Modais e Auxiliares
        function showSuccessModal(msg) {
            document.getElementById('success-msg').innerText = msg;
            document.getElementById('success-modal').classList.remove('hidden-section');
        }

        // Adicionar Perguntas no Quiz
        let qCount = 1;
        function addQuestion() {
            qCount++;
            const container = document.getElementById('questions-container');
            const div = document.createElement('div');
            div.className = "p-6 bg-slate-50 rounded-2xl border animate-fade-in";
            div.innerHTML = `
                <div class="flex items-start gap-4 mb-4">
                    <input type="text" placeholder="Pergunta ${qCount}" class="flex-1 p-3 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-500/20">
                    <label class="cursor-pointer bg-white border border-slate-200 p-3 rounded-xl hover:bg-slate-50 transition-all text-slate-500 hover:text-blue-600 flex items-center justify-center" title="Adicionar Imagem">
                        <i data-lucide="image" size="20"></i>
                        <input type="file" accept="image/*" class="hidden">
                    </label>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div class="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-white">
                        <input type="radio" name="q${qCount}_correct" value="0" class="w-4 h-4 text-blue-600 cursor-pointer" required>
                        <input type="text" placeholder="Opção A" class="w-full text-sm outline-none bg-transparent">
                    </div>
                    <div class="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-white">
                        <input type="radio" name="q${qCount}_correct" value="1" class="w-4 h-4 text-blue-600 cursor-pointer" required>
                        <input type="text" placeholder="Opção B" class="w-full text-sm outline-none bg-transparent">
                    </div>
                    <div class="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-white">
                        <input type="radio" name="q${qCount}_correct" value="2" class="w-4 h-4 text-blue-600 cursor-pointer" required>
                        <input type="text" placeholder="Opção C" class="w-full text-sm outline-none bg-transparent">
                    </div>
                    <div class="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-white">
                        <input type="radio" name="q${qCount}_correct" value="3" class="w-4 h-4 text-blue-600 cursor-pointer" required>
                        <input type="text" placeholder="Opção D" class="w-full text-sm outline-none bg-transparent">
                    </div>
                </div>
            `;
            container.appendChild(div);
            lucide.createIcons();
        }

        async function salvarQuiz() {
            const tituloInput = document.getElementById('quiz-titulo');
            if (!tituloInput || !tituloInput.value) {
                alert('Preencha o título do quiz!');
                return;
            }

            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
            if (authError || !user) {
                alert('Usuário não autenticado!');
                return;
            }

            const container = document.getElementById('questions-container');
            const questions = container.children;
            let result = [];
            
            for(let i=0; i<questions.length; i++) {
                const inputs = questions[i].querySelectorAll('input[type="text"]');
                const radios = questions[i].querySelectorAll('input[type="radio"]');
                let correctIdx = -1;
                
                radios.forEach(r => {
                    if (r.checked) correctIdx = parseInt(r.value);
                });

                if (correctIdx === -1) {
                    alert(`Por favor, marque a alternativa correta na pergunta ${i+1}.`);
                    return;
                }

                result.push({
                    pergunta: inputs[0].value,
                    opcoes: [inputs[1].value, inputs[2].value, inputs[3].value, inputs[4].value],
                    correta: correctIdx
                });
            }

            const btn = document.querySelector('button[onclick="salvarQuiz()"]');
            let originalText = "";
            if (btn) {
                originalText = btn.innerText;
                btn.innerText = 'Salvando...';
                btn.disabled = true;
            }

            const quizData = {
                titulo: tituloInput.value,
                perguntas: result,
                voluntario_id: user.id
            };

            const { data, error } = await supabaseClient.from('quizzes').insert([quizData]);

            if (error) {
                alert("Erro ao salvar quiz no banco: " + error.message);
                if (btn) {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            } else {
                alert('Quiz criado e publicado com sucesso!');
                window.location.reload();
            }
        }

        // Lógica de Material de Apoio
        function toggleMaterialInput() {
            const tipo = document.getElementById('material-tipo').value;
            const cArquivo = document.getElementById('container-arquivo');
            const cLink = document.getElementById('container-link');
            const cQuiz = document.getElementById('container-quiz');
            
            const iArquivo = document.getElementById('material-arquivo');
            const iLink = document.getElementById('material-link');
            const iQuiz = document.getElementById('material-quiz');

            cArquivo.classList.add('hidden-section');
            cLink.classList.add('hidden-section');
            if (cQuiz) cQuiz.classList.add('hidden-section');
            
            iArquivo.required = false;
            iLink.required = false;
            if (iQuiz) iQuiz.required = false;

            if (tipo === 'arquivo') {
                cArquivo.classList.remove('hidden-section');
                iArquivo.required = true;
            } else if (tipo === 'link') {
                cLink.classList.remove('hidden-section');
                iLink.required = true;
            } else if (tipo === 'quiz' && cQuiz) {
                cQuiz.classList.remove('hidden-section');
                iQuiz.required = true;
            }
        }

        function handleSalvarMaterial(e) {
            e.preventDefault();
            showSuccessModal("Material de apoio publicado com sucesso!");
            e.target.reset();
            toggleMaterialInput();
        }

        // Lógica de Perfil
        function atualizarFotoPerfil(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const perfilFoto = document.getElementById('perfil-foto');
                    const headerAvatar = document.getElementById('header-avatar');
                    if (perfilFoto) perfilFoto.src = e.target.result;
                    if (headerAvatar) headerAvatar.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        }

        async function salvarPerfil(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<div class="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';
            btn.disabled = true;

            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
            if (authError || !user) {
                showSuccessModal("Usuário não autenticado.");
                btn.innerHTML = originalContent;
                btn.disabled = false;
                return;
            }

            const nome = document.getElementById('perfil-nome').value;
            const disciplina = document.getElementById('perfil-disciplina').value;

            const { error } = await supabaseClient
                .from('voluntarios')
                .update({
                    nome: nome,
                    formacao: disciplina
                })
                .eq('id', user.id);

            if (error) {
                showSuccessModal("Erro ao salvar: " + error.message);
            } else {
                showSuccessModal("Perfil atualizado com sucesso!");
                await carregarDadosUsuario(user);
            }

            btn.innerHTML = originalContent;
            btn.disabled = false;
        }

        window.handleLogout = handleLogout;
        window.showSection = showSection;
        window.showSuccessModal = showSuccessModal;
        window.handleSalvarAula = handleSalvarAula;
        window.removerAula = removerAula;
        window.addQuestion = addQuestion;
        window.salvarQuiz = salvarQuiz;
        window.toggleMaterialInput = toggleMaterialInput;
        window.handleSalvarMaterial = handleSalvarMaterial;
        window.atualizarFotoPerfil = atualizarFotoPerfil;
        window.salvarPerfil = salvarPerfil;
        window.closeModal = function() {
            document.getElementById('success-modal').classList.add('hidden-section');
        };

        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar && overlay) {
                if (sidebar.classList.contains('-translate-x-full')) {
                    sidebar.classList.remove('-translate-x-full');
                    overlay.classList.remove('hidden');
                } else {
                    sidebar.classList.add('-translate-x-full');
                    overlay.classList.add('hidden');
                }
            }
        }

        function closeSidebarOnMobile() {
            if (window.innerWidth < 768) {
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebar-overlay');
                if (sidebar && overlay) {
                    sidebar.classList.add('-translate-x-full');
                    overlay.classList.add('hidden');
                }
            }
        }

        window.toggleSidebar = toggleSidebar;
        window.closeSidebarOnMobile = closeSidebarOnMobile;
