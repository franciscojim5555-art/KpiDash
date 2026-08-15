/* global dscc */

const ICONS = {
  warning:
    '<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
  check:
    '<svg viewBox="0 0 24 24"><path d="M9 16.2l-3.5-3.5L4 14.2 9 19.2 20 8.2l-1.5-1.5z"/></svg>'
};

function formatNumber(n, decimals) {
  return n.toLocaleString('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatValue(n, format, currency, decimals, unitLabel) {
  switch (format) {
    case 'porcentaje':
      return formatNumber(n, decimals) + '%';
    case 'numero':
      return formatNumber(n, decimals) + (unitLabel ? ' ' + unitLabel : '');
    case 'moneda':
      return currency + formatNumber(n, decimals);
    default:
      return formatNumber(n, decimals);
  }
}

function getRangeColor(pct, style) {
  if (pct < style.lowMax.value) return style.lowColor.value.color;
  if (pct < style.midMax.value) return style.midColor.value.color;
  return style.highColor.value.color;
}

function getRoot() {
  let root = document.getElementById('root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
  }
  return root;
}

function fillTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? values[key] : match
  );
}

function drawViz(message) {
  const root = getRoot();
  const table = message.tables.DEFAULT;

  if (!table || table.length === 0) {
    root.innerHTML =
      '<div class="empty-state">Agrega el campo "Valor actual" en la pestaña Datos.</div>';
    return;
  }

  const style = message.style;
  const row = table[0];

  const current = Number(row.metricActual[0]) || 0;
  const target = row.metricObjetivo ? Number(row.metricObjetivo[0]) || 0 : 0;
  const faltanteOverride = row.metricFaltante ? Number(row.metricFaltante[0]) : null;
  const faltante = faltanteOverride !== null ? faltanteOverride : Math.max(0, target - current);

  const format = style.valueFormat.value;
  const currency = style.currencySymbol.value;
  const decimals = Number(style.decimalPlaces.value);
  const unitLabel = style.unitLabel.value;

  const showTitle = style.showTitle.value;
  const titleText = style.titleText.value;
  const showSubtitle = style.showSubtitle.value;
  const showAlertBadge = style.showAlertBadge.value;

  const cardBackgroundColor = style.cardBackgroundColor.value.color;
  const barTrackColor = style.barTrackColor.value.color;
  const valueColor = style.valueColor.value.color;
  const barColorMode = style.barColorMode.value;
  const fixedBarColor = style.fixedBarColor.value.color;

  const pct = target > 0 ? Math.min(999, (current / target) * 100) : 0;
  const rangeColor = getRangeColor(Math.min(pct, 100), style);
  const barColor = barColorMode === 'fijo' ? fixedBarColor : rangeColor;
  const barWidth = Math.min(100, pct);
  const icon = pct >= 100 ? ICONS.check : ICONS.warning;

  const displayValue =
    format === 'fraccion'
      ? `${formatNumber(current, 0)} <span class="kpi-value-slash">/</span> ${formatNumber(target, 0)}`
      : formatValue(current, format, currency, decimals, unitLabel);

  const subtitleValues = {
    objetivo: formatValue(target, format === 'fraccion' ? 'numero' : format, currency, decimals, unitLabel),
    faltante: formatValue(faltante, format === 'fraccion' ? 'numero' : format, currency, decimals, unitLabel),
    actual: formatValue(current, format === 'fraccion' ? 'numero' : format, currency, decimals, unitLabel),
    pct: pct.toFixed(0) + '%'
  };
  const subtitleText = fillTemplate(style.subtitleTemplate.value, subtitleValues);

  const minLabel = format === 'moneda' ? currency + '0' : '0';
  const maxLabel =
    formatValue(target, format === 'fraccion' ? 'numero' : format, currency, decimals, unitLabel) +
    (format === 'fraccion' && unitLabel ? ' ' + unitLabel : '');

  root.innerHTML = `
    <div class="card" style="background:${cardBackgroundColor}">
      <div class="card-header">
        ${showTitle ? `<div class="card-title">${titleText}</div>` : ''}
        ${
          showAlertBadge
            ? `<div class="alert-badge" style="background:${rangeColor}1a; color:${rangeColor};">
                 <span class="badge-icon" style="fill:${rangeColor}">${icon}</span>
                 <span>${pct.toFixed(0)}%</span>
               </div>`
            : ''
        }
      </div>
      <div class="kpi-value" style="color:${valueColor}">${displayValue}</div>
      ${showSubtitle ? `<div class="kpi-sub">${subtitleText}</div>` : ''}
      <div class="progress-track" style="background:${barTrackColor}">
        <div class="progress-fill" style="width:${barWidth}%; background:${barColor}"></div>
      </div>
      <div class="progress-labels">
        <span>${minLabel}</span>
        <span>${maxLabel}</span>
      </div>
    </div>
  `;
}

dscc.subscribeToData(drawViz, { transform: dscc.objectTransform });
