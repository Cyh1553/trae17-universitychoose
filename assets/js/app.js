/* 志愿通 · 前端主逻辑（零构建，hash 路由） */
(function () {
  'use strict';

  /* ---------------- 工具 ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? '' : s)
    .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').toLowerCase();

  const RULES = window.GK_RULES || [];
  const MAJORS = window.GK_MAJORS || [];
  const DIRECTIONS = window.GK_DIRECTIONS || [];
  const UNIS = (function () {
    const raw = []
      .concat(window.GK_UNIVERSITIES_985 || [])
      .concat(window.GK_UNIVERSITIES_211A || [])
      .concat(window.GK_UNIVERSITIES_211B || [])
      .concat(window.GK_UNIVERSITIES_SY || []);
    const seen = {};
    return raw.filter((u) => {
      if (!u || !u.name || seen[u.name]) return false;
      seen[u.name] = 1;
      return true;
    });
  })();
  const META = window.GK_DATA_META || {};

  const UI = {}; // 各页面临时状态

  /* ---------------- 首页 ---------------- */
  function viewHome() {
    const rules = RULES.length, majors = MAJORS.length, unis = UNIS.length;
    return `
    <section class="hero">
      <h1>填志愿，先看清规则，再看清方向</h1>
      <p class="sub">把散落在各省考试院、院校官网、就业报告里的信息，整理成可搜索、可比较的参考依据</p>
      <div class="hero-search">
        <input id="heroSearch" type="search" placeholder="搜索名词、专业或院校，例如：平行志愿 / 人工智能 / 四川大学" autocomplete="off">
        <button class="btn" id="heroSearchBtn">搜索</button>
      </div>
      <div class="hero-tips">
        <span>试试：</span>
        <span>平行志愿</span><span>·</span><span>专业级差</span><span>·</span>
        <span>集成电路</span><span>·</span><span>985 院校</span>
      </div>
    </section>

    <div class="grid grid-4">
      <a class="entry" href="#/rules">
        <div class="entry-icon">壹</div>
        <h3>填报规则与名词</h3>
        <p>平行志愿、专业级差、一分一段表、退档原因……用大白话讲清楚每个规则和名词。</p>
        <div class="meta">已收录 ${rules} 个名词与规则</div>
      </a>
      <a class="entry" href="#/majors">
        <div class="entry-icon">贰</div>
        <h3>行业前景与专业</h3>
        <p>专业热度榜、绿牌红牌专业、国家产业方向，看清“现在热”和“未来热”。</p>
        <div class="meta">已收录 ${majors} 个专业 · ${DIRECTIONS.length} 个方向</div>
      </a>
      <a class="entry" href="#/ai">
        <div class="entry-icon">叁</div>
        <h3>AI 志愿建议</h3>
        <p>输入分数、位次和意向，生成冲稳保参考方案与需要向 AI 追问的清单。</p>
        <div class="meta">位次优先 · 附风险提示</div>
      </a>
      <a class="entry" href="#/universities">
        <div class="entry-icon">肆</div>
        <h3>院校库与分类</h3>
        <p>985 / 211 / 双一流分类检索，特色学科、王牌专业、宿舍环境一表看清。</p>
        <div class="meta">已收录 ${unis} 所院校</div>
      </a>
    </div>

    <div class="section-head">
      <h2>使用建议</h2>
      <span class="hint">信息检索 ≠ 决策，最终请回到官方文件</span>
    </div>
    <div class="grid grid-3">
      <div class="card">
        <div class="card-title">1. 先用位次，不要用分数</div>
        <p class="card-desc">每年试卷难度不同，分数线会浮动，但位次的含金量相对稳定。先用一分一段表查到自己的全省位次。</p>
      </div>
      <div class="card">
        <div class="card-title">2. 再看规则，别踩硬红线</div>
        <p class="card-desc">退档最常见的四个原因：不服从调剂、单科成绩不达标、体检受限、投档比例卡位。填报前逐条核对招生章程。</p>
      </div>
      <div class="card">
        <div class="card-title">3. 最后排梯度，冲稳保都要有</div>
        <p class="card-desc">只填“冲”不填“保”是最典型的滑档原因。保底志愿一定是自己愿意去的，否则等于白填。</p>
      </div>
    </div>

    <div class="section-head">
      <h2>关于本平台数据</h2>
    </div>
    <div class="card">
      <p class="card-desc"><b>数据来源：</b>${esc(META.sources || '公开资料整理')}</p>
      <p class="card-desc" style="margin-top:8px"><b>更新说明：</b>${esc(META.updated || '示例数据')}</p>
      <div class="note-box">${esc(META.disclaimer || '本平台内容仅供信息参考。')}</div>
    </div>
    `;
  }

  /* ---------------- 板块一：规则与名词 ---------------- */
  function ruleCard(t, open) {
    return `
    <div class="term ${open ? 'open' : ''}" data-id="${esc(t.id)}">
      <button class="term-head" type="button">
        <span class="term-name">${esc(t.term)}</span>
        <span class="tag ${t.scope === '分省差异' ? 'tag-amber' : 'tag-plain'}">${esc(t.scope)}</span>
        <span class="term-def">${esc(t.def)}</span>
        <span class="term-caret">▾</span>
      </button>
      <div class="term-body">
        <div class="term-block"><span class="k">通俗解释</span><div class="v">${esc(t.plain)}</div></div>
        <div class="term-block"><span class="k">举个例子</span><div class="v">${esc(t.example)}</div></div>
        <div class="term-block pitfall"><span class="k">易错提醒</span><div class="v">${esc(t.pitfall)}</div></div>
      </div>
    </div>`;
  }

  function viewRules() {
    const cats = ['全部'].concat(Array.from(new Set(RULES.map((r) => r.cat))));
    UI.rules = { cat: '全部', q: '' };
    return `
    <div class="page-head">
      <h1>填报规则与名词解释</h1>
      <p>用清晰简明的语言解释志愿填报中的规则与术语。标注「分省差异」的条目，各省规定不同，请以本省考试院当年文件为准。</p>
    </div>
    <div class="toolbar">
      <div class="chips" id="ruleCats">
        ${cats.map((c) => `<button class="chip ${c === '全部' ? 'on' : ''}" data-cat="${esc(c)}" type="button">${esc(c)}</button>`).join('')}
      </div>
      <input type="search" id="ruleSearch" placeholder="搜索名词或关键词，如：调剂 / 位次 / 退档">
      <span class="result-count" id="ruleCount"></span>
    </div>
    <div class="term-list" id="ruleList"></div>`;

  }

  function paintRules() {
    const st = UI.rules;
    const kw = norm(st.q);
    const list = RULES.filter((t) => {
      const okCat = st.cat === '全部' || t.cat === st.cat;
      if (!okCat) return false;
      if (!kw) return true;
      return norm([t.term, t.def, t.plain, t.example, t.pitfall, t.cat].join(' ')).includes(kw);
    });
    $('#ruleList').innerHTML = list.length
      ? list.map((t) => ruleCard(t, kw && list.length <= 6)).join('')
      : `<div class="empty"><div class="big">⌕</div>没有找到匹配的名词，换个关键词试试</div>`;
    $('#ruleCount').textContent = `共 ${list.length} 条`;
  }

  /* ---------------- 板块二：专业与行业 ---------------- */
  function viewMajors() {
    UI.majors = { level: '全部' };
    return `
    <div class="page-head">
      <h1>行业前景与专业热度</h1>
      <p>热度指数由公开就业报告、招生计划变化与产业政策综合整理的<b>参考值</b>，用于了解趋势，不作为报考依据。</p>
    </div>
    <div class="toolbar">
      <div class="chips" id="majorLevels">
        <button class="chip on" data-lv="全部" type="button">全部专业</button>
        <button class="chip" data-lv="绿牌" type="button">绿牌（需求增长）</button>
        <button class="chip" data-lv="黄牌" type="button">黄牌（供需平衡）</button>
        <button class="chip" data-lv="红牌" type="button">红牌（就业偏难）</button>
      </div>
      <span class="result-count" id="majorCount"></span>
    </div>
    <div id="majorList"></div>

    <div class="section-head">
      <h2>未来热门方向</h2>
      <span class="hint">政策 + 产业趋势 + 对应专业</span>
    </div>
    <div class="grid grid-3" id="dirList"></div>

    <div class="note-box" style="margin-top:20px">${esc(META.disclaimer || '')}</div>`;
  }

  function paintMajors() {
    const st = UI.majors;
    const list = MAJORS
      .filter((m) => st.level === '全部' || m.level === st.level)
      .slice()
      .sort((a, b) => b.heat - a.heat);
    $('#majorList').innerHTML = list.map((m) => {
      const lvTag = m.level === '绿牌' ? 'tag-green' : m.level === '红牌' ? 'tag-red' : 'tag-amber';
      return `
      <div class="major-row" data-major="${esc(m.name)}">
        <div class="major-name">${esc(m.name)}</div>
        <div class="major-cat">${esc(m.cat)}</div>
        <div class="major-bar"><i style="width:${Number(m.heat) || 0}%"></i></div>
        <div class="major-score">${esc(m.heat)}</div>
        <div class="major-flags">
          <span class="tag ${lvTag}">${esc(m.level)}</span>
        </div>
      </div>`;
    }).join('');
    $('#majorCount').textContent = `共 ${list.length} 个专业`;

    $('#dirList').innerHTML = DIRECTIONS.map((d) => `
      <div class="dir-card">
        <h3>${esc(d.name)}</h3>
        <span class="heat">热度：${esc(d.heat)}</span>
        <p>${esc(d.desc)}</p>
        <p><b>政策支撑：</b>${esc(d.policy)}</p>
        <div class="tag-row">${d.majors.map((x) => `<span class="tag tag-plain">${esc(x)}</span>`).join('')}</div>
      </div>`).join('');
  }

  /* ---------------- 板块四：院校库 ---------------- */
  const PAGE_SIZE = 25;

  function uniTags(u) {
    return (u.tags || []).map((t) => {
      const cls = t === '985' ? 'badge-985' : t === '211' ? 'badge-211' : 'badge-sy';
      return `<span class="tag ${cls}">${esc(t)}</span>`;
    }).join('');
  }

  function viewUniversities() {
    const provinces = Array.from(new Set(UNIS.map((u) => u.province))).sort();
    const types = Array.from(new Set(UNIS.map((u) => u.type))).sort();
    UI.unis = { q: '', tag: '全部', prov: '全部', type: '全部', page: 1 };
    return `
    <div class="page-head">
      <h1>院校库 · 985 / 211 / 双一流</h1>
      <p>覆盖 985、211 及双一流建设高校。特色学科与王牌专业来自公开资料整理，<b>宿舍与环境条件因校区、楼栋差异较大且会翻新，请以院校官网与新生指南为准。</b></p>
    </div>
    <div class="toolbar">
      <input type="search" id="uniSearch" placeholder="搜索院校名称、简称、城市或特色学科">
      <select id="uniProv"><option value="全部">全部地区</option>${provinces.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select>
      <select id="uniType"><option value="全部">全部类型</option>${types.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select>
      <div class="chips" id="uniTags">
        ${['全部', '985', '211', '双一流'].map((t) => `<button class="chip ${t === '全部' ? 'on' : ''}" data-tag="${esc(t)}" type="button">${esc(t)}</button>`).join('')}
      </div>
      <span class="result-count" id="uniCount"></span>
    </div>
    <div class="table-wrap">
      <table class="data">
        <thead><tr>
          <th>院校</th><th>层次</th><th>地区</th><th>类型</th>
          <th>特色学科</th><th>王牌专业</th><th>宿舍情况（参考）</th>
        </tr></thead>
        <tbody id="uniBody"></tbody>
      </table>
    </div>
    <div class="pager" id="uniPager"></div>`;
  }

  function uniFiltered() {
    const st = UI.unis;
    const kw = norm(st.q);
    return UNIS.filter((u) => {
      if (st.tag !== '全部' && !(u.tags || []).includes(st.tag)) return false;
      if (st.prov !== '全部' && u.province !== st.prov) return false;
      if (st.type !== '全部' && u.type !== st.type) return false;
      if (!kw) return true;
      return norm([u.name, u.province, u.city, u.type, u.featureSubjects, u.topMajors, u.environment, u.note].join(' ')).includes(kw);
    });
  }

  function paintUniversities() {
    const st = UI.unis;
    const list = uniFiltered();
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (st.page > pages) st.page = pages;
    const start = (st.page - 1) * PAGE_SIZE;
    const rows = list.slice(start, start + PAGE_SIZE);

    $('#uniBody').innerHTML = rows.length ? rows.map((u) => `
      <tr data-uni="${esc(u.id || u.name)}">
        <td class="uname">${esc(u.name)}</td>
        <td><div class="tag-row">${uniTags(u)}</div></td>
        <td class="nowrap">${esc(u.province)}</td>
        <td class="nowrap">${esc(u.type)}</td>
        <td class="clamp">${esc(u.featureSubjects)}</td>
        <td class="clamp">${esc(u.topMajors)}</td>
        <td class="clamp">${esc(u.dorm)}</td>
      </tr>`).join('')
      : `<tr><td colspan="7"><div class="empty"><div class="big">⌕</div>没有符合条件的院校，试试放宽筛选条件</div></td></tr>`;

    $('#uniCount').textContent = `共 ${total} 所`;

    const btns = [];
    btns.push(`<button type="button" data-page="${st.page - 1}" ${st.page === 1 ? 'disabled' : ''}>‹</button>`);
    const win = 5;
    let s = Math.max(1, st.page - 2), e = Math.min(pages, s + win - 1);
    s = Math.max(1, Math.min(s, pages - win + 1));
    for (let i = s; i <= e; i++) btns.push(`<button type="button" data-page="${i}" class="${i === st.page ? 'on' : ''}">${i}</button>`);
    btns.push(`<button type="button" data-page="${st.page + 1}" ${st.page === pages ? 'disabled' : ''}>›</button>`);
    btns.push(`<span class="info">第 ${st.page} / ${pages} 页</span>`);
    $('#uniPager').innerHTML = pages > 1 ? btns.join('') : '';
  }

  function openUni(key) {
    const u = UNIS.find((x) => String(x.id || x.name) === String(key));
    if (!u) return;
    const row = (k, v) => `<div class="drow"><span class="dk">${esc(k)}</span><span class="dv">${esc(v || '暂无公开数据')}</span></div>`;
    $('#drawerHead').innerHTML = `
      <h2>${esc(u.name)}</h2>
      <div class="tag-row">${uniTags(u)}<span class="tag tag-plain">${esc(u.province)} · ${esc(u.city)}</span><span class="tag tag-plain">${esc(u.type)}</span></div>
      <button class="drawer-close" id="drawerClose" type="button">✕</button>`;
    $('#drawerBody').innerHTML = `
      ${row('特色学科', u.featureSubjects)}
      ${row('王牌专业', u.topMajors)}
      ${row('校园环境', u.environment)}
      ${row('宿舍情况', u.dorm)}
      ${row('食堂', u.canteen)}
      ${row('学费参考', u.tuition)}
      ${row('转专业', u.transfer)}
      ${row('保研情况', u.baoyan)}
      ${row('就业情况', u.employment)}
      ${row('男女比例', u.genderRatio)}
      <div class="note-box">${esc(u.note || '以上为公开资料整理，仅供参考，请以院校官网与当年招生章程为准。')}</div>`;
    $('#drawer').classList.add('show');
    $('#drawerMask').classList.add('show');
  }
  function closeUni() {
    $('#drawer').classList.remove('show');
    $('#drawerMask').classList.remove('show');
  }

  /* ---------------- 板块三：AI 志愿建议 ---------------- */
  function viewAI() {
    const provinces = Array.from(new Set(UNIS.map((u) => u.province))).sort();
    return `
    <div class="page-head">
      <h1>AI 志愿建议</h1>
      <p>填写你的分数、位次与意向，生成一份<b>冲稳保参考框架</b>和一份可直接粘贴给任意大模型的<b>提问模板</b>。输出仅为参考，不构成录取承诺。</p>
    </div>

    <div class="card" style="margin-bottom:18px">
      <div class="card-title">第一步 · 填写你的情况</div>
      <p class="card-desc" style="margin-bottom:16px">带 * 的为必填。位次比分数更重要，请务必填全省位次。</p>
      <div class="form-grid">
        <div class="field"><label>省份 *</label>
          <select id="aiProv"><option value="">请选择</option>${provinces.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}<option value="其他">其他省份</option></select>
        </div>
        <div class="field"><label>科类 / 选科 *</label>
          <select id="aiKe"><option value="">请选择</option><option>物理类</option><option>历史类</option><option>理科</option><option>文科</option><option>综合改革</option></select>
        </div>
        <div class="field"><label>高考分数 *</label><input id="aiScore" type="number" placeholder="如 612"></div>
        <div class="field"><label>全省位次 *</label><input id="aiRank" type="number" placeholder="如 12600"></div>
        <div class="field"><label>意向专业</label><input id="aiMajor" placeholder="如 计算机、临床医学（可多个）"></div>
        <div class="field"><label>意向职业</label><input id="aiJob" placeholder="如 算法工程师、医生"></div>
        <div class="field"><label>意向城市</label><input id="aiCity" placeholder="如 成都、杭州（可多个）"></div>
        <div class="field"><label>意向院校</label><input id="aiUni" placeholder="如 四川大学、电子科技大学"></div>
        <div class="field"><label>特别说明</label><input id="aiExtra" placeholder="如 不接受医学类 / 家庭希望留在省内"></div>
      </div>
      <div style="margin-top:18px;display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn" id="aiGen" type="button">生成参考建议</button>
        <button class="btn btn-ghost" id="aiClear" type="button">清空</button>
      </div>
    </div>

    <div class="card" id="aiResultCard" style="display:none">
      <div class="card-title">第二步 · 参考建议</div>
      <p class="card-desc" style="margin-bottom:14px">下面是依据位次区间生成的<b>填报框架</b>，不是录取预测。请配合官方数据使用。</p>
      <div id="aiResult" style="display:grid;gap:14px"></div>

      <div class="section-head" style="margin-top:26px"><h2>可直接粘贴给 AI 的提问模板</h2></div>
      <p class="card-desc" style="margin-bottom:10px">把下面的内容复制到任何大模型（或本页下方的 API 调用框）即可获得更具体的分析。</p>
      <div class="out-box" id="aiPrompt"></div>
      <div style="margin-top:12px"><button class="btn btn-ghost btn-sm" id="aiCopy" type="button">复制提问模板</button></div>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="card-title">第三步 · 接入大模型（可选）</div>
      <p class="card-desc" style="margin-bottom:14px">如果你有大模型 API，可在此填入地址与密钥，直接在当前页面获得 AI 回答。密钥只保存在你本机浏览器，不会上传到任何第三方。</p>
      <div class="form-grid">
        <div class="field"><label>API 地址</label><input id="apiUrl" placeholder="如 https://api.openai.com/v1/chat/completions"></div>
        <div class="field"><label>模型名称</label><input id="apiModel" placeholder="如 gpt-4o-mini / deepseek-chat"></div>
        <div class="field"><label>API Key</label><input id="apiKey" type="password" placeholder="sk-..."></div>
      </div>
      <div style="margin-top:18px"><button class="btn" id="aiCall" type="button">调用 AI 生成建议</button></div>
      <div class="out-box" id="aiAnswer" style="display:none;margin-top:16px"></div>
    </div>`;
  }

  function buildPrompt(v) {
    return `你是一位熟悉中国高考志愿填报规则的升学规划顾问。请基于以下考生信息，给出一份结构化的志愿填报参考建议。

【考生信息】
- 省份：${v.province}
- 科类/选科：${v.ke}
- 高考分数：${v.score}
- 全省位次：${v.rank}
- 意向专业：${v.major || '未明确'}
- 意向职业：${v.job || '未明确'}
- 意向城市：${v.city || '未明确'}
- 意向院校：${v.uni || '未明确'}
- 特别说明：${v.extra || '无'}

【输出要求】
1. 先用「位次法」把该位次换算为往年的等效位次区间，说明换算假设，并提醒我以本省一分一段表为准。
2. 按「冲 / 稳 / 保」三档，分别给出建议的位次区间与院校层次范围，并说明每档大概应安排多少个志愿。
3. 针对我的意向专业，说明该专业常见的选科要求、单科要求与体检限制。
4. 列出我必须在院校招生章程里逐条核对的 5 项内容（如专业级差、服从调剂规则、单科要求、体检要求、转专业政策）。
5. 指出我这份需求中存在的 3 个最大风险点，并给出规避建议。
6. 最后给出 5 个我应该继续追问你的问题。

【硬性约束】
- 不确定的数据必须明确标注「需核实」，不要编造具体录取分数或名次。
- 不得给出任何「保证录取」的表述。
- 全部结论必须以本省考试院当年文件和院校当年招生章程为最终依据。`;
  }

  function localAdvice(v) {
    const s = Number(v.score) || 0;
    const r = Number(v.rank) || 0;
    const band = (a, b) => `位次约 ${Math.max(1, Math.round(r * a)).toLocaleString()} — ${Math.round(r * b).toLocaleString()} 名`;
    return [
      { t: '冲（有机会，但需接受风险）', d: `建议位次区间：比你的位次靠前，约 ${Math.max(1, Math.round(r * 0.55)).toLocaleString()} — ${Math.round(r * 0.9).toLocaleString()} 名。<br>建议占志愿总数的 20%~30%。这一档要用来博更好的院校或专业，同时必须勾选服从调剂。` },
      { t: '稳（把握较大）', d: `建议位次区间：与你接近，约 ${band(0.9, 1.25)}。<br>建议占 40%~50%。这一档是你的主战场，应重点核对专业组内是否有不能接受的专业。` },
      { t: '保（兜底，必须能走）', d: `建议位次区间：明显低于你的位次，约 ${band(1.25, 2.2)}。<br>建议占 30% 左右，且最后 1~2 个志愿要确保绝对能录取，避免滑档。` },
      { t: '必查清单（5 项）', d: '① 是否有专业级差；② 服从调剂的具体范围；③ 单科成绩要求（英语/数学）；④ 体检与色盲色弱限制；⑤ 转专业与大类分流的规则。' },
      { t: '你当前信息里的主要风险', d: (v.major || v.city || v.uni)
        ? `你填写了意向（专业：${esc(v.major) || '—'}；城市：${esc(v.city) || '—'}；院校：${esc(v.uni) || '—'}），这属于<b>强意向</b>。强意向最容易导致志愿集中、梯度不足，建议保留至少 30% 不设意向限制的志愿作为保底。`
        : '你尚未填写专业、城市或院校意向。意向过宽会导致排序困难，建议先确定 2~3 个优先方向，再排梯度。' },
      { t: '免责说明', d: '以上为基于位次区间的通用框架，<b>不是录取概率预测</b>，也未使用本省历年录取数据。最终请以本省考试院文件和院校招生章程为准。' }
    ];
  }

  function aiGenerate() {
    const v = {
      province: $('#aiProv').value, ke: $('#aiKe').value,
      score: $('#aiScore').value.trim(), rank: $('#aiRank').value.trim(),
      major: $('#aiMajor').value.trim(), job: $('#aiJob').value.trim(),
      city: $('#aiCity').value.trim(), uni: $('#aiUni').value.trim(),
      extra: $('#aiExtra').value.trim()
    };
    const missing = [];
    if (!v.province) missing.push('省份');
    if (!v.ke) missing.push('科类/选科');
    if (!v.score) missing.push('高考分数');
    if (!v.rank) missing.push('全省位次');
    if (missing.length) {
      $('#aiResultCard').style.display = 'block';
      $('#aiResult').innerHTML = `<div class="note-box">请先填写：${esc(missing.join('、'))}。位次是最关键的字段，请务必填写。</div>`;
      $('#aiPrompt').textContent = '';
      return;
    }
    $('#aiResultCard').style.display = 'block';
    $('#aiResult').innerHTML = localAdvice(v).map((b) => `
      <div class="card" style="box-shadow:none">
        <div class="card-title">${esc(b.t)}</div>
        <p class="card-desc">${b.d}</p>
      </div>`).join('');
    $('#aiPrompt').textContent = buildPrompt(v);
  }

  async function aiCall() {
    const url = $('#apiUrl').value.trim();
    const key = $('#apiKey').value.trim();
    const model = $('#apiModel').value.trim();
    const box = $('#aiAnswer');
    box.style.display = 'block';
    if (!url || !key || !model) { box.textContent = '请先完整填写 API 地址、模型名称和 API Key。'; return; }
    const prompt = $('#aiPrompt').textContent;
    if (!prompt) { box.textContent = '请先点击上方「生成参考建议」，让系统准备好提问模板。'; return; }
    box.textContent = '正在请求模型…';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: '你是一位严谨的中国高考志愿填报顾问，不编造数据，不承诺录取。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3
        })
      });
      const data = await res.json();
      const text = data && data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : JSON.stringify(data).slice(0, 1200);
      box.textContent = text;
    } catch (err) {
      box.textContent = '请求失败：' + (err && err.message ? err.message : String(err))
        + '\n\n提示：浏览器直接调用第三方 API 可能被跨域（CORS）拦截。若失败，请改用上面的「复制提问模板」，粘贴到对应大模型的对话框中使用。';
    }
  }

  /* ---------------- 全局搜索 ---------------- */
  function viewSearch(q) {
    const kw = norm(q);
    const rl = RULES.filter((t) => norm([t.term, t.def, t.plain, t.cat].join(' ')).includes(kw)).slice(0, 8);
    const mj = MAJORS.filter((m) => norm([m.name, m.cat, m.desc].join(' ')).includes(kw)).slice(0, 8);
    const un = UNIS.filter((u) => norm([u.name, u.province, u.city, u.type, u.featureSubjects, u.topMajors, u.note].join(' ')).includes(kw)).slice(0, 12);
    const total = rl.length + mj.length + un.length;
    return `
    <div class="page-head">
      <h1>搜索「${esc(q)}」</h1>
      <p>共找到 ${total} 条结果${total === 0 ? '，换个关键词试试' : ''}。</p>
    </div>
    ${!total ? `<div class="empty"><div class="big">⌕</div>没有找到相关内容</div>` : ''}
    ${rl.length ? `
      <div class="section-head"><h2>规则与名词</h2><span class="hint">${rl.length} 条</span></div>
      <div class="term-list">${rl.map((t) => ruleCard(t, false)).join('')}</div>` : ''}
    ${mj.length ? `
      <div class="section-head"><h2>专业与行业</h2><span class="hint">${mj.length} 条</span></div>
      <div class="grid grid-2">${mj.map((m) => `
        <div class="card"><div class="card-title">${esc(m.name)}</div>
        <div class="tag-row" style="margin:8px 0"><span class="tag tag-plain">${esc(m.cat)}</span><span class="tag">热度 ${esc(m.heat)}</span></div>
        <p class="card-desc">${esc(m.desc)}</p></div>`).join('')}</div>` : ''}
    ${un.length ? `
      <div class="section-head"><h2>院校</h2><span class="hint">${un.length} 所（最多显示 12 所）</span></div>
      <div class="grid grid-3">${un.map((u) => `
        <a class="card" href="#/universities" data-jump-uni="${esc(u.id || u.name)}">
          <div class="card-title">${esc(u.name)}</div>
          <div class="tag-row" style="margin:8px 0">${uniTags(u)}<span class="tag tag-plain">${esc(u.province)}</span></div>
          <p class="card-desc">${esc(u.topMajors)}</p></a>`).join('')}</div>` : ''}`;
  }

  /* ---------------- 路由 ---------------- */
  const RENDERERS = {
    home: viewHome, rules: viewRules, majors: viewMajors,
    universities: viewUniversities, ai: viewAI
  };

  function route() {
    const raw = location.hash.replace(/^#\/?/, '') || 'home';
    const [path, qs] = raw.split('?');
    const params = new URLSearchParams(qs || '');
    const name = RENDERERS[path] ? path : 'home';

    if (path === 'search') {
      $('#app').innerHTML = viewSearch(params.get('q') || '');
    } else {
      $('#app').innerHTML = RENDERERS[name]();
    }

    document.querySelectorAll('#nav a').forEach((a) => {
      a.classList.toggle('active', a.dataset.route === (path === 'search' ? '' : name));
    });

    if (name === 'rules' && path !== 'search') paintRules();
    if (name === 'majors' && path !== 'search') paintMajors();
    if (name === 'universities' && path !== 'search') paintUniversities();
    if (path === 'search') {
      const q = params.get('q') || '';
      const gs = $('#globalSearch'); if (gs) gs.value = q;
    }
    window.scrollTo(0, 0);
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) {
        const box = chip.parentElement;
        box.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
        chip.classList.add('on');
        if (box.id === 'ruleCats') { UI.rules.cat = chip.dataset.cat; paintRules(); }
        if (box.id === 'majorLevels') { UI.majors.level = chip.dataset.lv; paintMajors(); }
        if (box.id === 'uniTags') { UI.unis.tag = chip.dataset.tag; UI.unis.page = 1; paintUniversities(); }
        return;
      }

      const head = e.target.closest('.term-head');
      if (head) { head.parentElement.classList.toggle('open'); return; }

      const mrow = e.target.closest('.major-row');
      if (mrow) { openMajor(mrow.dataset.major); return; }

      const urow = e.target.closest('tr[data-uni]');
      if (urow) { openUni(urow.dataset.uni); return; }

      const jump = e.target.closest('[data-jump-uni]');
      if (jump) {
        const key = jump.dataset.jumpUni;
        setTimeout(() => {
          const row = document.querySelector(`tr[data-uni="${key}"]`);
          if (row) { openUni(key); } else { openUni(key); }
        }, 60);
        return;
      }

      const pbtn = e.target.closest('#uniPager button[data-page]');
      if (pbtn && !pbtn.disabled) {
        UI.unis.page = Number(pbtn.dataset.page) || 1;
        paintUniversities();
        document.querySelector('.table-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (e.target.id === 'drawerMask' || e.target.closest('#drawerClose')) { closeUni(); return; }
      if (e.target.id === 'aiGen') { aiGenerate(); return; }
      if (e.target.id === 'aiCall') { aiCall(); return; }
      if (e.target.id === 'aiClear') {
        ['aiScore', 'aiRank', 'aiMajor', 'aiJob', 'aiCity', 'aiUni', 'aiExtra'].forEach((id) => { $('#' + id).value = ''; });
        $('#aiProv').value = ''; $('#aiKe').value = '';
        $('#aiResultCard').style.display = 'none'; $('#aiAnswer').style.display = 'none';
        return;
      }
      if (e.target.id === 'aiCopy') {
        const btn = e.target;
        const box = $('#aiPrompt');
        const txt = box.textContent;
        const reset = () => { btn.textContent = '复制提问模板'; };
        const done = () => { btn.textContent = '已复制 ✓'; setTimeout(reset, 1600); };
        const selectAll = () => {
          const r = document.createRange();
          r.selectNodeContents(box);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(r);
          btn.textContent = '已全选，请按 Ctrl+C';
          setTimeout(reset, 2400);
        };
        const legacy = () => {
          const ta = document.createElement('textarea');
          ta.value = txt;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
          document.body.appendChild(ta);
          ta.select();
          let ok = false;
          try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
          document.body.removeChild(ta);
          if (ok) done(); else selectAll();
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(done, legacy);
        } else {
          legacy();
        }
        return;
      }
      if (e.target.id === 'heroSearchBtn') {
        const q = $('#heroSearch').value.trim();
        if (q) location.hash = '#/search?q=' + encodeURIComponent(q);
        return;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (e.target.id === 'globalSearch' || e.target.id === 'heroSearch') {
        const q = e.target.value.trim();
        if (q) location.hash = '#/search?q=' + encodeURIComponent(q);
      }
    });

    let timer = null;
    document.addEventListener('input', (e) => {
      const id = e.target.id;
      if (id === 'ruleSearch' || id === 'uniSearch') {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (id === 'ruleSearch') { UI.rules.q = e.target.value; paintRules(); }
          else { UI.unis.q = e.target.value; UI.unis.page = 1; paintUniversities(); }
        }, 160);
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'uniProv') { UI.unis.prov = e.target.value; UI.unis.page = 1; paintUniversities(); }
      if (e.target.id === 'uniType') { UI.unis.type = e.target.value; UI.unis.page = 1; paintUniversities(); }
    });

    window.addEventListener('hashchange', route);
  }

  function openMajor(name) {
    const m = MAJORS.find((x) => x.name === name);
    if (!m) return;
    const lvTag = m.level === '绿牌' ? 'tag-green' : m.level === '红牌' ? 'tag-red' : 'tag-amber';
    const row = (k, v) => `<div class="drow"><span class="dk">${esc(k)}</span><span class="dv">${esc(v || '暂无公开数据')}</span></div>`;
    $('#drawerHead').innerHTML = `
      <h2>${esc(m.name)}</h2>
      <div class="tag-row">
        <span class="tag tag-plain">${esc(m.cat)}</span>
        <span class="tag ${lvTag}">${esc(m.level)}</span>
        <span class="tag">热度 ${esc(m.heat)}</span>
        <span class="tag tag-plain">趋势：${esc(m.trend)}</span>
      </div>
      <button class="drawer-close" id="drawerClose" type="button">✕</button>`;
    $('#drawerBody').innerHTML = `
      ${row('专业简介', m.desc)}
      ${row('薪酬参考', m.salary)}
      ${row('典型岗位', (m.jobs || []).join('、'))}
      <div class="note-box">热度指数与薪酬为公开资料综合整理的参考值，仅供了解趋势，请以官方与招生章程为准。</div>`;
    $('#drawer').classList.add('show');
    $('#drawerMask').classList.add('show');
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    if (!document.getElementById('drawer')) {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div class="drawer-mask" id="drawerMask"></div>
        <aside class="drawer" id="drawer">
          <div class="drawer-head" id="drawerHead"></div>
          <div class="drawer-body" id="drawerBody"></div>
        </aside>`;
      document.body.appendChild(wrap);
    }
    bind();
    route();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
