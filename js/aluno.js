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
                window.location.href = 'loginAluno.html';
            }
        });
    

        

        async function carregarDadosUsuario(user) {
            // Buscar dados do perfil
            const { data: perfil, error } = await supabaseClient
                .from('alunos')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error("Erro ao carregar perfil:", error);
            }

            const nomeExibicao = perfil?.nome || user.email.split('@')[0];
            const dificuldade = perfil?.dificuldade_principal || 'Matemática';
            const serie = perfil?.serie || 'Não informada';

            // Atualizar elementos da UI
            const headerName = document.getElementById('header-username');
            if (headerName) headerName.innerText = nomeExibicao;

            const headerAvatar = document.getElementById('header-avatar');
            if (headerAvatar) headerAvatar.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nomeExibicao)}`;

            const welcomeText = document.getElementById('dashboard-welcome');
            if (welcomeText) welcomeText.innerText = `Bem-vindo(a), ${nomeExibicao.split(' ')[0]}! 🚀`;

            const diffBadge = document.getElementById('dashboard-dificuldade');
            if (diffBadge) {
                diffBadge.innerHTML = `<i data-lucide="${getIconForMateria(dificuldade)}" size="14"></i> ${dificuldade}`;
            }

            // Preencher form de perfil
            const perfilNomeInput = document.getElementById('perfil-nome');
            if (perfilNomeInput) perfilNomeInput.value = nomeExibicao;

            const perfilEmailInput = document.getElementById('perfil-email');
            if (perfilEmailInput) perfilEmailInput.value = user.email;

            const perfilDiffSelect = document.getElementById('perfil-dificuldade');
            if (perfilDiffSelect) perfilDiffSelect.value = dificuldade;

            const perfilSerieInput = document.getElementById('perfil-serie');
            if (perfilSerieInput) perfilSerieInput.value = serie;

            const perfilFoto = document.getElementById('perfil-foto');
            if (perfilFoto) perfilFoto.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nomeExibicao)}`;
            
            const perfilNomeTitulo = document.getElementById('perfil-nome-titulo');
            if (perfilNomeTitulo) perfilNomeTitulo.innerText = nomeExibicao;
            const perfilSerieTitulo = document.getElementById('perfil-serie-titulo');
            if (perfilSerieTitulo) perfilSerieTitulo.innerText = `Aluno do ${serie}`;

            // Ocultar auth-container apenas se ele existir (previne TypeError)
            const authCont = document.getElementById('auth-container');
            if (authCont) authCont.classList.add('hidden-section');
            const appWrap = document.getElementById('app-wrapper');
            if (appWrap) appWrap.classList.remove('hidden-section');
            lucide.createIcons();

            // Carregar aulas
            await carregarAulas();
            await carregarQuizzes();
        }

        
        

        

        async function handleLogout() {
            try {
                await supabaseClient.auth.signOut();
            } catch(e) {
                console.error("Logout falhou", e);
            } finally {
                window.location.href = 'loginAluno.html';
            }
        }

        async function carregarAulas() {
            const container = document.getElementById('lista-aulas-container');
            container.innerHTML = '<div class="text-center py-10"><div class="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto"></div></div>';

            const { data: aulas, error } = await supabaseClient
                .from('aulas')
                .select('*, voluntarios(nome)')
                .order('data', { ascending: true });

            const proxHorario = document.getElementById('proxima-aula-horario');
            const proxTitulo = document.getElementById('proxima-aula-titulo');
            const proxProf = document.getElementById('proxima-aula-prof');
            const proxLink = document.getElementById('proxima-aula-link');

            if (error || !aulas || aulas.length === 0) {
                container.innerHTML = `
                <div class="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3"><i data-lucide="video-off"></i></div>
                    <p class="font-bold text-slate-700">Nenhuma aula agendada</p>
                    <p class="text-slate-400 text-xs mt-1">Fique atento! Novas aulas serão cadastradas em breve.</p>
                </div>`;
                if (proxHorario) proxHorario.innerText = "--";
                if (proxTitulo) proxTitulo.innerText = "Sem aulas no horizonte";
                if (proxProf) proxProf.innerHTML = "Aproveite para revisar os materiais!";
                if (proxLink) proxLink.classList.add('hidden');
                lucide.createIcons();
                return;
            }

            // Atualizar Próxima Aula no Dashboard
            const proxima = aulas[0];
            if (proxima && proxHorario && proxTitulo && proxProf && proxLink) {
                const dia = proxima.data.split('-')[2];
                const mes = getNomeMes(proxima.data.split('-')[1]);
                proxHorario.innerText = `${dia} de ${mes} • ${proxima.inicio} às ${proxima.fim}`;
                proxTitulo.innerText = proxima.titulo;
                proxProf.innerHTML = `<i data-lucide="user" size="16"></i> Prof(a). ${proxima.voluntarios?.nome || 'Voluntário'} • ${proxima.materia}`;
                proxLink.href = proxima.meet_url;
                proxLink.classList.remove('hidden');
            }

            container.innerHTML = aulas.map(aula => {
                const dia = aula.data.split('-')[2];
                const mes = getNomeMes(aula.data.split('-')[1]);
                const borderClass = getBorderColor(aula.materia);
                const colorClass = getTextColor(aula.materia);
                const bgClass = getBgColor(aula.materia);

                return `
                <div class="item-card p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 ${borderClass}">
                    <div class="flex items-start gap-4">
                        <div class="${bgClass} ${colorClass} p-4 rounded-2xl mt-1">
                            <div class="text-center leading-tight">
                                <span class="block text-xl font-black">${dia}</span>
                                <span class="block text-[10px] font-bold uppercase tracking-widest">${mes}</span>
                            </div>
                        </div>
                        <div>
                            <span class="text-[10px] font-black uppercase ${colorClass} tracking-widest ${bgClass} px-2 py-1 rounded-md">${aula.materia}</span>
                            <h4 class="text-lg font-black text-slate-900 mt-2">${aula.titulo}</h4>
                            <p class="text-sm text-slate-500 mb-2">Prof(a). ${aula.voluntarios?.nome || 'Voluntário'}</p>
                            <div class="flex gap-4">
                                <span class="text-xs text-slate-500 font-medium flex items-center gap-1.5"><i data-lucide="clock" size="14" class="text-slate-400"></i> ${aula.inicio} - ${aula.fim}</span>
                            </div>
                        </div>
                    </div>
                    <a href="${aula.meet_url}" target="_blank" class="w-full md:w-auto text-center bg-sky-50 text-sky-600 border border-sky-100 px-6 py-3 rounded-xl text-sm font-black hover:bg-sky-500 hover:text-white transition-all">
                        PARTICIPAR AGORA
                    </a>
                </div>
                `;
            }).join('');

            lucide.createIcons();
        }

        function getNomeMes(mesNum) {
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return meses[parseInt(mesNum, 10) - 1] || 'Mês';
        }

        // Estilos e classes
        function getBorderColor(materia) {
            const map = { 'Matemática': 'border-left-math', 'Português': 'border-left-port', 'Inglês': 'border-left-eng', 'História': 'border-left-hist', 'Redação': 'border-left-red' };
            return map[materia] || 'border-left-eng';
        }

        function getTextColor(materia) {
            const map = { 'Matemática': 'text-red-500', 'Português': 'text-yellow-600', 'Inglês': 'text-blue-500', 'História': 'text-purple-500', 'Redação': 'text-green-500' };
            return map[materia] || 'text-slate-500';
        }

        function getBgColor(materia) {
            const map = { 'Matemática': 'bg-red-50', 'Português': 'bg-yellow-50', 'Inglês': 'bg-blue-50', 'História': 'bg-purple-50', 'Redação': 'bg-green-50' };
            return map[materia] || 'bg-slate-50';
        }

        function getIconForMateria(materia) {
            const map = {
                'matematica': 'calculator',
                'Matemática': 'calculator',
                'portugues': 'languages',
                'Português': 'languages',
                'ingles': 'globe',
                'Inglês': 'globe',
                'historia': 'landmark',
                'História': 'landmark',
                'redacao': 'pen-tool',
                'Redação': 'pen-tool'
            };
            return map[materia] || 'book-open';
        }

        function showSection(sectionId) {
            ['dashboard', 'aulas', 'materiais', 'quizzes', 'perfil'].forEach(id => {
                const sec = document.getElementById('section-' + id);
                if (sec) sec.classList.add('hidden-section');
            });
            
            const selectedSec = document.getElementById('section-' + sectionId);
            if (selectedSec) selectedSec.classList.remove('hidden-section');
            
            document.querySelectorAll('.nav-item').forEach(i => {
                i.classList.remove('active-nav', 'bg-slate-50');
                i.classList.add('text-slate-500');
            });
            
            const activeNav = document.getElementById('nav-' + sectionId);
            if(activeNav) {
                activeNav.classList.add('active-nav');
                activeNav.classList.remove('text-slate-500');
            }

            lucide.createIcons();
        }

        function showFeedbackModal(type, title, msg) {
            const modal = document.getElementById('success-modal');
            const iconContainer = document.getElementById('modal-icon-container');
            const titleEl = document.getElementById('modal-title');
            const msgEl = document.getElementById('success-msg');
            
            if (titleEl) titleEl.innerText = title;
            if (msgEl) msgEl.innerText = msg;

            if (iconContainer) {
                if (type === 'success') {
                    iconContainer.className = "w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6";
                    iconContainer.innerHTML = '<i data-lucide="check-circle-2" size="40"></i>';
                } else {
                    iconContainer.className = "w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6";
                    iconContainer.innerHTML = '<i data-lucide="x-circle" size="40"></i>';
                }
            }
            
            lucide.createIcons();
            if (modal) modal.classList.remove('hidden-section');
        }

        function showSuccessModal(msg) {
            showFeedbackModal('success', 'Perfeito!', msg);
        }

        function closeModal() {
            const modal = document.getElementById('success-modal');
            if (modal) modal.classList.add('hidden-section');
        }

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
                showFeedbackModal('error', 'Erro', 'Usuário não autenticado.');
                btn.innerHTML = originalContent;
                btn.disabled = false;
                return;
            }

            const nome = document.getElementById('perfil-nome').value;
            const dificuldade = document.getElementById('perfil-dificuldade').value;
            const serie = document.getElementById('perfil-serie').value;

            const { error } = await supabaseClient
                .from('alunos')
                .update({
                    nome: nome,
                    serie: serie,
                    dificuldade_principal: dificuldade
                })
                .eq('id', user.id);

            if (error) {
                showFeedbackModal('error', 'Erro ao salvar', error.message);
            } else {
                showFeedbackModal('success', 'Perfil updated!', 'Suas alterações foram salvas com sucesso.');
                await carregarDadosUsuario(user);
            }

            btn.innerHTML = originalContent;
            btn.disabled = false;
        }

        // Simulação do Quiz
        let quizzesGlobais = [];
        let quizAtualIndex = -1;

        async function carregarQuizzes() {
            const container = document.getElementById('lista-quizzes-container');
            const { data, error } = await supabaseClient
                .from('quizzes')
                .select('*, voluntarios(nome)');

            if (error) {
                console.error("Erro ao buscar quizzes:", error);
            }

            if (error || !data || data.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <div class="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl mx-auto flex items-center justify-center mb-4 border border-slate-100">
                            <i data-lucide="help-circle" size="32"></i>
                        </div>
                        <p class="text-slate-500 font-bold">Nenhum quiz disponível no momento.</p>
                    </div>`;
                lucide.createIcons();
                return;
            }

            quizzesGlobais = data;
            container.innerHTML = '';
            
            data.forEach((quiz, index) => {
                const totalPerguntas = Array.isArray(quiz.perguntas) ? quiz.perguntas.length : 0;
                container.innerHTML += `
                    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 item-card">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                                <i data-lucide="help-circle" size="24"></i>
                            </div>
                            <div>
                                <h4 class="font-black text-slate-900 text-lg">${quiz.titulo}</h4>
                                <p class="text-xs font-bold text-slate-400 mt-1 flex items-center gap-2">
                                    <i data-lucide="user" size="14"></i> Prof. ${quiz.voluntarios?.nome || 'Desconhecido'} • 
                                    <i data-lucide="list-checks" size="14"></i> ${totalPerguntas} Perguntas
                                </p>
                            </div>
                        </div>
                        <button onclick="iniciarQuiz(${index})" class="w-full md:w-auto shrink-0 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-black text-sm shadow-lg shadow-orange-200 transition-all active:scale-95">
                            RESPONDER
                        </button>
                    </div>
                `;
            });
            lucide.createIcons();
        }

        window.iniciarQuiz = function(index) {
            quizAtualIndex = index;
            const quiz = quizzesGlobais[index];
            if (!quiz) return;

            document.getElementById('quiz-modal-titulo').innerText = quiz.titulo;
            document.getElementById('quiz-modal-info').innerText = `${quiz.perguntas.length} Perguntas`;

            const container = document.getElementById('quiz-perguntas-container');
            container.innerHTML = '';

            quiz.perguntas.forEach((p, pIndex) => {
                const num = pIndex + 1;
                const letras = ['A', 'B', 'C', 'D'];
                let opcoesHTML = '';
                
                p.opcoes.forEach((op, oIndex) => {
                    opcoesHTML += `
                        <label class="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 cursor-pointer hover:border-sky-200 hover:bg-sky-50 transition-all group">
                            <input type="radio" name="q${pIndex}" value="${oIndex}" class="w-5 h-5 text-sky-600 focus:ring-sky-500 border-slate-300">
                            <span class="font-medium text-slate-700 group-hover:text-sky-700">${letras[oIndex]}) ${op}</span>
                        </label>
                    `;
                });

                container.innerHTML += `
                    <div class="mb-6 p-4 border border-slate-100 rounded-2xl bg-slate-50">
                        <h4 class="text-lg font-bold text-slate-800 mb-4">${num}. ${p.pergunta}</h4>
                        <div class="space-y-3">
                            ${opcoesHTML}
                        </div>
                    </div>
                `;
            });

            document.getElementById('quiz-modal').classList.remove('hidden-section');
        }

        window.fecharQuiz = function() {
            document.getElementById('quiz-modal').classList.add('hidden-section');
        }

        window.finalizarQuiz = function() {
            const quiz = quizzesGlobais[quizAtualIndex];
            if (!quiz) return;

            let acertos = 0;
            let total = quiz.perguntas.length;
            let faltou = false;

            for(let i=0; i<total; i++) {
                const selecionado = document.querySelector(`input[name="q${i}"]:checked`);
                if(!selecionado) {
                    faltou = true;
                    break;
                }
                const resIdx = parseInt(selecionado.value);
                if (resIdx === parseInt(quiz.perguntas[i].correta)) {
                    acertos++;
                }
            }

            if(faltou) {
                showFeedbackModal('error', 'Atenção', 'Você precisa responder todas as perguntas antes de finalizar!');
                return;
            }

            fecharQuiz();
            const nota = Math.ceil((acertos / total) * 10);
            
            if (nota >= 6) {
                showFeedbackModal('success', 'Quiz Finalizado!', `Parabéns! Você acertou ${acertos} de ${total} perguntas. Nota equivalente: ${nota}.`);
            } else {
                showFeedbackModal('error', 'Quiz Finalizado', `Você acertou ${acertos} de ${total} perguntas. Nota equivalente: ${nota}. Continue estudando e tente novamente!`);
            }
        }

        // Simulação do Vídeo
        function abrirVideo(url) {
            const modal = document.getElementById('video-modal');
            const iframe = document.getElementById('video-iframe');
            if (iframe) iframe.src = url;
            if (modal) modal.classList.remove('hidden-section');
        }

        function fecharVideo() {
            const modal = document.getElementById('video-modal');
            const iframe = document.getElementById('video-iframe');
            if (modal) modal.classList.add('hidden-section');
            if (iframe) iframe.src = "";
        }
        window.handleLogout = handleLogout;
        window.showSection = showSection;
        window.showFeedbackModal = showFeedbackModal;
        window.showSuccessModal = showSuccessModal;
        window.closeModal = closeModal;
        window.abrirVideo = abrirVideo;
        window.fecharVideo = fecharVideo;
        window.salvarPerfil = salvarPerfil;
        window.atualizarFotoPerfil = atualizarFotoPerfil;

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
