import { StartupRankResult } from '@/types'
import officialLogoImg from '@/assets/logo-viva-tec-v-cfca4.png'

interface PrintReportOptions {
  ranking: StartupRankResult[]
  eventName?: string
  generatedBy?: string
}

export function generatePostEventPdfReport({
  ranking,
  eventName = 'Festival de Apresentação Artística de Heróis Fictícios • Viva Tec',
  generatedBy = 'Comissão Organizadora Viva Tec (Senac & Sesc)',
}: PrintReportOptions) {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Montar HTML de impressão profissional e formatado para A4
  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Pós-Evento • Viva Tec</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 12mm 14mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1A1A1A;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      border-bottom: 3px solid #E11D74;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: linear-gradient(135deg, #701A75, #E11D74);
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-img {
      width: 36px;
      height: 36px;
      object-fit: contain;
      background: #fff;
      border-radius: 8px;
    }
    .title-group h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 900;
      color: #1A1A1A;
      letter-spacing: -0.5px;
    }
    .title-group h1 span {
      color: #E11D74;
    }
    .tagline {
      font-size: 9px;
      font-weight: 700;
      color: #E11D74;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }
    .subtitle {
      font-size: 10px;
      color: #555;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
      font-size: 9px;
      color: #666;
    }
    .header-right strong {
      color: #1A1A1A;
      font-size: 10px;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-magenta {
      background: #FDF2F8;
      color: #BE185D;
      border: 1px solid #FBCFE8;
    }
    .badge-rank-1 {
      background: #E11D74;
      color: #FFFFFF;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .badge-rank-2 {
      background: #E2E8F0;
      color: #1E293B;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .badge-rank-3 {
      background: #FEF3C7;
      color: #92400E;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .badge-rank-other {
      background: #F1F5F9;
      color: #475569;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }

    /* Resumo Geral Tabela */
    .summary-section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #1A1A1A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-left: 3px solid #E11D74;
      padding-left: 8px;
      margin-bottom: 8px;
    }
    table.summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-bottom: 12px;
    }
    table.summary-table th {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      padding: 5px 6px;
      text-align: left;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      font-size: 8.5px;
    }
    table.summary-table td {
      border: 1px solid #E2E8F0;
      padding: 5px 6px;
      vertical-align: middle;
    }
    table.summary-table tr:nth-child(even) {
      background: #FAFAFA;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .text-magenta { color: #E11D74; }

    /* Startup Card Individual */
    .startup-block {
      page-break-inside: avoid;
      border: 1.5px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 14px;
      background: #FFFFFF;
    }
    .startup-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #F1F5F9;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .startup-title-area h2 {
      margin: 0;
      font-size: 13px;
      font-weight: 900;
      color: #1A1A1A;
    }
    .startup-title-area .startup-sub {
      font-size: 10px;
      color: #E11D74;
      font-weight: 700;
    }
    .startup-students {
      font-size: 9.5px;
      color: #475569;
      margin-top: 3px;
    }
    .startup-scores-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 6px;
      margin-bottom: 8px;
      text-align: center;
    }
    .score-item {
      padding: 2px;
    }
    .score-label {
      font-size: 7.5px;
      color: #64748B;
      text-transform: uppercase;
      font-weight: 700;
      display: block;
      line-height: 1.1;
    }
    .score-val {
      font-size: 11px;
      font-weight: 900;
      color: #1A1A1A;
      margin-top: 2px;
      display: block;
    }
    .score-max {
      font-size: 7.5px;
      color: #94A3B8;
    }

    /* Observações Qualitativas */
    .observations-list {
      margin-top: 6px;
    }
    .observation-item {
      background: #FDF2F8;
      border-left: 3px solid #E11D74;
      border-radius: 4px;
      padding: 6px 8px;
      margin-top: 4px;
      font-size: 9.5px;
    }
    .observation-evaluator {
      font-weight: 800;
      color: #701A75;
      margin-bottom: 2px;
      display: flex;
      justify-content: space-between;
    }
    .observation-text {
      color: #334155;
      font-style: italic;
      line-height: 1.35;
    }
    .no-observations {
      font-size: 9px;
      color: #94A3B8;
      font-style: italic;
      padding: 4px 0;
    }

    .footer {
      border-top: 1px solid #CBD5E1;
      padding-top: 8px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #64748B;
    }
  </style>
</head>
<body>

  <!-- CABEÇALHO OFICIAL VIVA TEC -->
  <div class="header">
    <div class="header-left">
      <div class="logo-box">
        <img src="${officialLogoImg}" class="logo-img" alt="Viva Tec" />
      </div>
      <div class="title-group">
        <h1>VIVA <span>TEC</span> — Relatório Geral Pós-Evento</h1>
        <div class="tagline">Próxima parada: Ensino Médio • Parceria Senac & Sesc</div>
        <div class="subtitle">${eventName}</div>
      </div>
    </div>
    <div class="header-right">
      <div>Data de Emissão: <strong>${currentDate}</strong></div>
      <div>Escola Educar Sesc Monsenhor Jonas Abib</div>
      <div>Gerado por: <strong>${generatedBy}</strong></div>
    </div>
  </div>

  <!-- QUADRO RESUMO GERAL DAS NOTAS E RANKING -->
  <div class="summary-section">
    <div class="section-title">Quadro Consolidado de Classificação Oficial</div>
    <table class="summary-table">
      <thead>
        <tr>
          <th class="text-center" style="width: 40px;">Rank</th>
          <th>Herói Fictício & Startup</th>
          <th class="text-center">Pilar ESG</th>
          <th class="text-center">Avaliadores</th>
          <th class="text-center">ESG (1º)</th>
          <th class="text-center">Criat. (2º)</th>
          <th class="text-center">Engaj. (3º)</th>
          <th class="text-center">Média Geral</th>
          <th class="text-center">Penalidade</th>
          <th class="text-right" style="color: #E11D74;">Nota Final</th>
        </tr>
      </thead>
      <tbody>
        ${ranking
          .map((item) => {
            const rankClass =
              item.rank === 1
                ? 'badge-rank-1'
                : item.rank === 2
                  ? 'badge-rank-2'
                  : item.rank === 3
                    ? 'badge-rank-3'
                    : 'badge-rank-other'
            return `
          <tr>
            <td class="text-center">
              <span class="${rankClass}">${item.rank}º</span>
            </td>
            <td>
              <strong style="color: #1A1A1A;">${item.startup.hero_name}</strong>
              <span style="color: #64748B; font-size: 8.5px; display: block;">${item.startup.name}</span>
            </td>
            <td class="text-center font-bold">${item.startup.esg_pillar}</td>
            <td class="text-center">${item.evaluationsCount} parecer(es)</td>
            <td class="text-center font-bold" style="color: #047857;">${item.avgESG.toFixed(2)}</td>
            <td class="text-center font-bold" style="color: #E11D74;">${item.avgCriatividade.toFixed(2)}</td>
            <td class="text-center font-bold">${item.avgEngajamento.toFixed(2)}</td>
            <td class="text-center">${item.avgTotalEvaluators.toFixed(2)}</td>
            <td class="text-center" style="color: ${item.timePenalty > 0 ? '#DC2626' : '#64748B'};">
              ${item.timePenalty > 0 ? `-${item.timePenalty.toFixed(1)} pts` : '0.0'}
            </td>
            <td class="text-right font-black" style="color: #E11D74; font-size: 11px;">
              ${item.finalScore.toFixed(2)}
            </td>
          </tr>
        `
          })
          .join('')}
      </tbody>
    </table>
  </div>

  <!-- SEÇÃO COMPILADA DE OBSERVAÇÕES QUALITATIVAS POR STARTUP -->
  <div class="summary-section">
    <div class="section-title">Compilação Detalhada por Startup & Pareceres da Banca Examinadora</div>

    ${ranking
      .map((item) => {
        const obs = item.qualitativeObservations || []
        const rankClass =
          item.rank === 1
            ? 'badge-rank-1'
            : item.rank === 2
              ? 'badge-rank-2'
              : item.rank === 3
                ? 'badge-rank-3'
                : 'badge-rank-other'

        return `
      <div class="startup-block">
        <div class="startup-header">
          <div class="startup-title-area">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="${rankClass}">${item.rank}º Lugar</span>
              <h2>${item.startup.hero_name}</h2>
              <span class="badge badge-magenta">${item.startup.esg_pillar}</span>
            </div>
            <div class="startup-sub">Startup: ${item.startup.name}</div>
            ${
              item.startup.estudantes
                ? `<div class="startup-students">👥 <strong>Estudantes:</strong> ${item.startup.estudantes}</div>`
                : ''
            }
          </div>
          <div class="text-right">
            <div style="font-size: 8px; color: #64748B; text-transform: uppercase; font-weight: bold;">Nota Final Oficial</div>
            <div style="font-size: 16px; font-weight: 900; color: #E11D74;">${item.finalScore.toFixed(2)} <span style="font-size: 9px; color: #64748B;">/ 100</span></div>
            ${item.timePenalty > 0 ? `<div style="font-size: 8px; color: #DC2626; font-weight: bold;">Penalidade: -${item.timePenalty} pts</div>` : ''}
            ${item.tieBreakerReason ? `<div style="font-size: 8px; color: #701A75; font-weight: bold;">★ ${item.tieBreakerReason}</div>` : ''}
          </div>
        </div>

        <!-- Grade de Médias nos 7 Critérios -->
        <div class="startup-scores-grid">
          <div class="score-item">
            <span class="score-label">1. ESG (1º)</span>
            <span class="score-val" style="color: #047857;">${item.avgESG.toFixed(2)}</span>
            <span class="score-max">/ 20</span>
          </div>
          <div class="score-item">
            <span class="score-label">2. Criatividade (2º)</span>
            <span class="score-val" style="color: #E11D74;">${item.avgCriatividade.toFixed(2)}</span>
            <span class="score-max">/ 20</span>
          </div>
          <div class="score-item">
            <span class="score-label">3. Engajamento (3º)</span>
            <span class="score-val">${item.avgEngajamento.toFixed(2)}</span>
            <span class="score-max">/ 15</span>
          </div>
          <div class="score-item">
            <span class="score-label">4. Figurino</span>
            <span class="score-val">${item.avgFigurino.toFixed(2)}</span>
            <span class="score-max">/ 15</span>
          </div>
          <div class="score-item">
            <span class="score-label">5. Narrativa</span>
            <span class="score-val">${item.avgNarrativa.toFixed(2)}</span>
            <span class="score-max">/ 15</span>
          </div>
          <div class="score-item">
            <span class="score-label">6. Briefing</span>
            <span class="score-val">${item.avgBriefing.toFixed(2)}</span>
            <span class="score-max">/ 10</span>
          </div>
          <div class="score-item">
            <span class="score-label">7. Gestão Tempo</span>
            <span class="score-val">${item.avgGestaoTempo.toFixed(2)}</span>
            <span class="score-max">/ 5</span>
          </div>
        </div>

        <!-- Pareceres Qualitativos da Banca -->
        <div class="observations-list">
          <div style="font-size: 9px; font-weight: 800; color: #1A1A1A; text-transform: uppercase; margin-bottom: 3px;">
            Observações Qualitativas dos Jurados (${obs.length} parecer${obs.length === 1 ? '' : 'es'}):
          </div>
          ${
            obs.length > 0
              ? obs
                  .map(
                    (o) => `
              <div class="observation-item">
                <div class="observation-evaluator">
                  <span>✦ ${o.evaluatorName}</span>
                  <span style="font-size: 8.5px; color: #E11D74; font-weight: 900;">Nota atribuída: ${o.totalScore}/100</span>
                </div>
                <div class="observation-text">"${o.feedback}"</div>
              </div>
            `,
                  )
                  .join('')
              : `<div class="no-observations">Nenhuma observação qualitativa registrada para esta equipe até o momento.</div>`
          }
        </div>
      </div>
      `
      })
      .join('')}
  </div>

  <!-- RODAPÉ INSTITUCIONAL -->
  <div class="footer">
    <div>Viva Tec • Sistema de Avaliação & Vitrine Digital • Senac & Sesc Ceará</div>
    <div>Critérios Oficiais: ESG (1º) • Criatividade (2º) • Engajamento (3º) • Figurino • Narrativa • Briefing • Gestão de Tempo</div>
    <div>Página 1 de 1</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
`

  // Abrir janela de impressão com renderização perfeita e acionar window.print() (compatível com "Salvar como PDF")
  const printWindow = window.open('', '_blank', 'width=1000,height=800')
  if (printWindow) {
    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  } else {
    // Fallback: criar iframe invisível
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(htmlContent)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }, 500)
    }
  }
}
