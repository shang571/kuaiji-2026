/* ============================================================
 题库：题目数据 + 判分 / 错题 / 筛选
   依赖：charts 无关；被 nav.js 的渲染与统计调用
   ============================================================ */

/* ============================================================
   题库：54 题（会计 28 / 财管 26）
   ============================================================ */
var BANK = [
/* ---------- 会计 ---------- */
{id:'a1',cat:'acct',type:'single',ch:0,q:'会计是以（　）作为主要计量单位。',o:['实物计量单位','劳动计量单位','货币计量单位','时间计量单位'],a:[2],e:'会计以货币为主要计量单位，这是货币计量假设的直接体现。实物、劳动量度只能作为辅助。'},
{id:'a2',cat:'acct',type:'single',ch:0,q:'下列关于会计主体的说法，正确的是（　）。',o:['会计主体与法律主体完全对等','会计主体不一定是法律主体','法律主体就是会计主体','法律主体不一定是会计主体'],a:[1],e:'会计主体是独立主体，但不一定是法律主体。分公司是会计主体而非法律主体，企业集团编制合并报表也是会计主体。'},
{id:'a3',cat:'acct',type:'single',ch:0,q:'某分公司不是独立法人，它是否可以作为会计主体？',o:['不可以，必须有法人资格','可以，会计主体不要求法人资格','只有编制合并报表时才可以','只有独立核算且具备法人资格时才可以'],a:[1],e:'会计主体解决「为谁核算」的空间范围问题，与法人资格无关。分公司独立核算，因此是会计主体。'},
{id:'a4',cat:'acct',type:'single',ch:1,q:'3 月 29 日销售产品 20 000 元，5 月 15 日收到货款存入银行。按收付实现制核算，该项收入应归属于（　）。',o:['3 月','5 月','本年','视情况而定'],a:[1],e:'收付实现制以现金是否收到为标准。5 月 15 日实际收到款项，因此收入归属 5 月；若按权责发生制则归属 3 月。'},
{id:'a5',cat:'acct',type:'single',ch:1,q:'按权责发生制，下列应确认为本月费用的是（　）。',o:['支付上月的水电费','本月负担但尚未支付的借款利息','预付下年度的保险费','购入生产设备的支出'],a:[1],e:'权责发生制看责任是否发生。本月负担的利息无论是否支付都属于本月费用；支付上月费用属于上月，预付下年属于下年，设备支出属于资本性支出。'},
{id:'a6',cat:'acct',type:'single',ch:2,q:'下列项目中，属于资产项目的是（　）。',o:['应收账款','预收账款','资本公积','实收资本'],a:[0],e:'应收账款是企业拥有的债权，属于资产；预收账款是负债；资本公积与实收资本属于所有者权益。'},
{id:'a7',cat:'acct',type:'single',ch:2,q:'所有者权益在数量上等于（　）。',o:['流动资产减去全部负债','全部资产减去流动负债','全部资产减去非流动负债','全部资产减去全部负债'],a:[3],e:'所有者权益 = 资产总额 − 负债总额，即净资产。这是会计恒等式的移项结果。'},
{id:'a8',cat:'acct',type:'single',ch:2,q:'以银行存款偿还短期借款，这笔业务会使（　）。',o:['资产一增一减','资产与负债同时增加','资产与负债同时减少','负债一增一减'],a:[2],e:'银行存款（资产）减少，短期借款（负债）减少，两边同减同额，会计等式仍平衡。'},
{id:'a9',cat:'acct',type:'single',ch:3,q:'售后回租在会计上不确认销售收入，体现的信息质量要求是（　）。',o:['可靠性','实质重于形式','谨慎性','重要性'],a:[1],e:'法律形式是「卖」，但经济实质是「融资」（风险与报酬未转移），因此按融资处理。这是实质重于形式的经典案例。'},
{id:'a10',cat:'acct',type:'single',ch:3,q:'存货期末按成本与可变现净值孰低计量，体现的是（　）。',o:['可比性','重要性','谨慎性','及时性'],a:[2],e:'不高估资产、不低估负债和费用，是谨慎性的要求。存货跌价准备正是这一原则的落地。'},
{id:'a11',cat:'acct',type:'single',ch:4,q:'会计账户与会计科目的根本区别是（　）。',o:['名称不同','反映的经济内容不同','有无格式','有无结构'],a:[3],e:'科目只是名称与分类项目，没有结构；账户有格式和结构，能记录增减变动及余额。两者反映的经济内容相同。'},
{id:'a12',cat:'acct',type:'single',ch:5,q:'资产类账户的增加额应登记在（　）。',o:['借方','贷方','任意一方','余额方向'],a:[0],e:'资产、成本、费用类账户增加记借方；负债、所有者权益、收入类账户增加记贷方。'},
{id:'a13',cat:'acct',type:'single',ch:5,q:'下列错误中，能够通过试算平衡发现的是（　）。',o:['一笔业务被漏记','借贷方向正确但科目用错','借方发生额合计比贷方多 100 元','同一笔业务被重复过账'],a:[2],e:'试算平衡只能发现借贷金额不等。漏记、重记、串户、方向颠倒等错误，借贷仍然相等，无法通过试算平衡发现。'},
{id:'a14',cat:'acct',type:'single',ch:6,q:'从银行提取现金，应编制的记账凭证是（　）。',o:['现金收款凭证','银行存款付款凭证','转账凭证','现金付款凭证'],a:[1],e:'现金与银行存款之间相互划转，只编制付款凭证，不编制收款凭证，以避免同一笔业务重复记账。'},
{id:'a15',cat:'acct',type:'single',ch:7,q:'期末编制调整分录的主要目的是（　）。',o:['更正记账错误','简化账簿登记','贯彻权责发生制，正确划分收入费用的归属期间','调整现金流量'],a:[2],e:'调整分录处理应计、预计、估计三类跨期项目，使收入费用落在正确的会计期间，是权责发生制的落地手段。'},
{id:'a16',cat:'acct',type:'single',ch:8,q:'企业接受投资者投入的机器设备，应贷记（　）。',o:['固定资产','实收资本','银行存款','盈余公积'],a:[1],e:'借：固定资产；贷：实收资本（股本）。若投入额超过注册资本份额，差额计入资本公积—资本溢价。'},
{id:'a17',cat:'acct',type:'single',ch:9,q:'一般纳税人购入材料支付的增值税进项税额，应（　）。',o:['计入材料采购成本','计入管理费用','记入「应交税费—应交增值税（进项税额）」借方','计入营业外支出'],a:[2],e:'一般纳税人进项税额可以抵扣，不计入存货成本，单独记入应交税费借方。小规模纳税人则计入成本。'},
{id:'a18',cat:'acct',type:'single',ch:9,q:'购入设备价款 50 000 元，另付安装费 3 000 元，增值税 6 500 元（可抵扣）。该设备入账价值为（　）。',o:['50 000 元','53 000 元','56 500 元','59 500 元'],a:[1],e:'入账价值 = 买价 50 000 + 安装费 3 000 = 53 000 元。可抵扣的增值税不计入固定资产成本。'},
{id:'a19',cat:'acct',type:'single',ch:10,q:'车间管理人员的工资应计入（　）。',o:['生产成本','制造费用','管理费用','销售费用'],a:[1],e:'生产工人工资计入生产成本；车间管理人员工资属于间接费用，先归集到制造费用，期末再分配计入产品成本。'},
{id:'a20',cat:'acct',type:'single',ch:10,q:'完工产品验收入库，正确的会计分录是（　）。',o:['借：生产成本　贷：库存商品','借：库存商品　贷：生产成本','借：主营业务成本　贷：库存商品','借：库存商品　贷：主营业务成本'],a:[1],e:'完工入库使库存商品增加、生产成本减少：借库存商品，贷生产成本。销售时才结转主营业务成本。'},
{id:'a21',cat:'acct',type:'single',ch:11,q:'销售商品收取的增值税销项税额，在会计处理上应（　）。',o:['计入主营业务收入','计入其他业务收入','冲减销售费用','不计入收入，确认为负债'],a:[3],e:'增值税是价外税，代收代付，不计入收入也不计入成本，贷记「应交税费—应交增值税（销项税额）」。'},
{id:'a22',cat:'acct',type:'single',ch:11,q:'下列不属于期间费用的是（　）。',o:['制造费用','管理费用','销售费用','财务费用'],a:[0],e:'制造费用属于成本类，期末分配计入产品成本；管理费用、销售费用、财务费用直接计入当期损益。'},
{id:'a23',cat:'acct',type:'single',ch:13,q:'现金流量表的编制基础是（　）。',o:['权责发生制','收付实现制','历史成本','公允价值'],a:[1],e:'现金流量表是唯一按收付实现制编制的报表，反映现金及现金等价物的实际流入流出。'},
{id:'a24',cat:'acct',type:'tf',ch:0,q:'判断：会计主体都应是法律主体。',o:['正确','错误'],a:[1],e:'错误。会计主体不一定是法律主体，分公司、企业集团都是反例。'},
{id:'a25',cat:'acct',type:'tf',ch:5,q:'判断：通过试算平衡表检查，如果借贷平衡，就说明记账没有错误。',o:['正确','错误'],a:[1],e:'错误。借贷平衡只能说明金额相等，无法发现漏记、重记、串户、方向颠倒等错误。'},
{id:'a26',cat:'acct',type:'tf',ch:9,q:'判断：制造费用属于期间费用，应直接计入当期损益。',o:['正确','错误'],a:[1],e:'错误。制造费用是成本类科目，期末分配计入产品成本，不属于期间费用。'},
{id:'a27',cat:'acct',type:'multi',ch:2,q:'下列会计要素中，反映企业财务状况的有（　）。',o:['资产','负债','收入','所有者权益','费用'],a:[0,1,3],e:'资产、负债、所有者权益反映财务状况，是资产负债表的要素；收入、费用、利润反映经营成果，是利润表的要素。'},
{id:'a28',cat:'acct',type:'multi',ch:5,q:'下列各项中，应在账户借方登记的有（　）。',o:['资产增加','成本费用增加','收入增加','负债减少','所有者权益减少'],a:[0,1,3,4],e:'借方登记资产增加、成本费用增加、负债与所有者权益减少；收入增加记贷方，所以 C 不选。'},

/* ---------- 财管 ---------- */
{id:'f1',cat:'fin',type:'single',ch:15,q:'下列财务管理目标中，最能体现资金时间价值与风险因素的是（　）。',o:['利润最大化','每股收益最大化','股东财富最大化','销售收入最大化'],a:[2],e:'股东财富最大化以股票市价衡量，既考虑当前收益，也考虑时间价值与风险；利润最大化忽视这两点。'},
{id:'f2',cat:'fin',type:'single',ch:16,q:'本金 10 000 元，年利率 10%，按复利计息 3 年后的终值最接近（　）。',o:['13 000 元','13 100 元','13 310 元','14 641 元'],a:[2],e:'FV = 10 000 × (1+10%)³ = 10 000 × 1.331 = 13 310 元。A 是单利算法，D 是 4 年的结果。'},
{id:'f3',cat:'fin',type:'single',ch:16,q:'每年年末支付 1 000 元，年利率 8%，永续年金的现值为（　）。',o:['8 000 元','12 500 元','10 000 元','无限大'],a:[1],e:'永续年金现值 = A ÷ r = 1 000 ÷ 8% = 12 500 元。虽然支付无限期，但折现后收敛于有限值。'},
{id:'f4',cat:'fin',type:'single',ch:16,q:'预付年金现值与普通年金现值的关系是（　）。',o:['二者相等','预付年金现值 = 普通年金现值 × (1+r)','预付年金现值 = 普通年金现值 ÷ (1+r)','预付年金现值 = 普通年金终值'],a:[1],e:'预付年金每期期初收付，比普通年金早一期，因此多计一期利息，乘以 (1+r)。'},
{id:'f5',cat:'fin',type:'single',ch:16,q:'某股票 β = 0.6，说明（　）。',o:['该股票没有风险','其系统性风险低于市场平均水平','其总风险一定低于市场','其收益率必然高于市场'],a:[1],e:'β 衡量系统性风险，β=0.6 表示波动幅度约为市场的 0.6 倍，属防御型；但非系统性风险仍然存在。'},
{id:'f6',cat:'fin',type:'single',ch:16,q:'无风险报酬率 4%，市场平均报酬率 9%，某股票 β = 1.2，其必要报酬率为（　）。',o:['8.0%','9.0%','10.0%','14.8%'],a:[2],e:'E(R) = 4% + 1.2 × (9%−4%) = 4% + 6% = 10%。'},
{id:'f7',cat:'fin',type:'single',ch:16,q:'衡量单项资产风险大小的绝对指标是（　）。',o:['标准差','变异系数','β 系数','期望收益率'],a:[0],e:'标准差是绝对风险指标；变异系数（标准差÷期望值）用于比较不同规模项目的相对风险；β 衡量系统性风险。'},
{id:'f8',cat:'fin',type:'single',ch:21,q:'某项目净现值恰好等于 0，说明（　）。',o:['项目亏损','项目收益率正好等于必要报酬率','项目现金流为 0','应拒绝该项目'],a:[1],e:'NPV=0 表示项目创造的回报刚好覆盖资本成本，处于盈亏平衡点，理论上可接受也可拒绝。'},
{id:'f9',cat:'fin',type:'single',ch:21,q:'两个互斥项目寿命期相同，决策应选择（　）。',o:['内含报酬率较高者','回收期较短者','净现值较大者','投资规模较小者'],a:[2],e:'寿命相同的互斥项目以 NPV 为准，因为 NPV 直接衡量股东财富的增量。IRR 在规模不同时可能误导。'},
{id:'f10',cat:'fin',type:'single',ch:21,q:'计算投资项目初始现金流量时，不应包括（　）。',o:['固定资产投资','营运资本垫支','设备安装费','项目决策前已发生的市场调研费'],a:[3],e:'决策前已发生的支出属于沉没成本，与当前决策无关，不计入增量现金流。'},
{id:'f11',cat:'fin',type:'single',ch:20,q:'债券票面利率 8%，筹资费率 0.5%，所得税率 25%，其资本成本最接近（　）。',o:['8.00%','7.50%','6.03%','5.75%'],a:[2],e:'Kd = 8% × (1−25%) ÷ (1−0.5%) = 6% ÷ 0.995 ≈ 6.03%。'},
{id:'f12',cat:'fin',type:'single',ch:20,q:'计算 WACC 时，权重最准确的口径是（　）。',o:['账面价值','市场价值','历史成本','目标结构下的账面价值'],a:[1],e:'市场价值最能反映当前真实的资本成本与融资比例；账面价值可能严重偏离实际。'},
{id:'f13',cat:'fin',type:'single',ch:20,q:'有税 MM 理论认为负债能提高企业价值，主要原因是（　）。',o:['债务成本永远最低','利息可税前扣除，产生税盾','债权人参与经营','负债没有风险'],a:[1],e:'利息在税前扣除，相当于政府承担了部分利息成本，形成税盾，从而提升企业价值。'},
{id:'f14',cat:'fin',type:'single',ch:20,q:'边际贡献 720 万元，息税前利润 370 万元，营业杠杆系数为（　）。',o:['1.21','1.95','2.36','0.51'],a:[1],e:'DOL = 边际贡献 ÷ EBIT = 720 ÷ 370 ≈ 1.95。'},
{id:'f15',cat:'fin',type:'single',ch:20,q:'EBIT 370 万元，利息 64.8 万元，财务杠杆系数为（　）。',o:['1.21','1.95','2.36','0.83'],a:[0],e:'DFL = EBIT ÷ (EBIT − I) = 370 ÷ 305.2 ≈ 1.21。'},
{id:'f16',cat:'fin',type:'single',ch:23,q:'经济订货批量（EOQ）模型的核心目标是（　）。',o:['存货数量最少','订货成本与储存成本之和最低','采购单价最低','缺货成本最低'],a:[1],e:'EOQ 使订货成本与储存成本之和最小，此时两者恰好相等。'},
{id:'f17',cat:'fin',type:'single',ch:23,q:'信用条件「2/10，n/30」的含义是（　）。',o:['10 天内付款享 2 元折扣，30 天付款','10 天内付款享 2% 折扣，30 天内全额付清','2 天内付款享 10% 折扣','30 天内付款享 2% 折扣'],a:[1],e:'2/10 表示 10 天内付款可享 2% 现金折扣；n/30 表示信用期 30 天，到期全额付款。'},
{id:'f18',cat:'fin',type:'single',ch:17,q:'杜邦分析把 ROE 分解为（　）。',o:['毛利率 × 周转率 × 负债率','净利率 × 周转率 × 权益乘数','净利率 × 毛利率 × 权益乘数','ROA × 资产负债率'],a:[1],e:'ROE = 销售净利率 × 总资产周转率 × 权益乘数，分别对应盈利能力、营运效率、财务杠杆三条路径。'},
{id:'f19',cat:'fin',type:'single',ch:17,q:'市盈率为 12 倍，意味着（　）。',o:['股价是每股净资产的 12 倍','市场愿为每 1 元利润支付 12 元','公司 12 年不分红','股息率为 12%'],a:[1],e:'PE = 每股市价 ÷ 每股收益，12 倍表示市场愿为每 1 元利润付 12 元，可理解为按当前盈利水平 12 年回本。'},
{id:'f20',cat:'fin',type:'single',ch:19,q:'可转换债券面值 1 000 元，转换价格 25 元/股，转换比率为（　）。',o:['25 股','40 股','0.025 股','1 000 股'],a:[1],e:'转换比率 = 债券面值 ÷ 转换价格 = 1 000 ÷ 25 = 40 股。'},
{id:'f21',cat:'fin',type:'single',ch:25,q:'净利润 1 000 万元，投资预算 800 万元，目标权益比重 60%，剩余股利政策下可分配股利为（　）。',o:['1 000 万元','800 万元','520 万元','480 万元'],a:[2],e:'所需权益资金 = 800 × 60% = 480 万元；可分配 = 1 000 − 480 = 520 万元。'},
{id:'f22',cat:'fin',type:'tf',ch:20,q:'判断：计算普通股资本成本时，也应像债券一样乘以 (1−所得税率)。',o:['正确','错误'],a:[1],e:'错误。股利在税后支付，不能抵税，因此普通股成本不乘 (1−T)；债券利息可税前扣除，才需要乘。'},
{id:'f23',cat:'fin',type:'tf',ch:21,q:'判断：对同一项目，IRR 与 NPV 的决策结论在任何情况下都一致。',o:['正确','错误'],a:[1],e:'错误。单一项目通常一致；但互斥项目在投资规模、寿命期或现金流时间分布不同时，两种方法可能给出相反结论，此时以 NPV 为准。'},
{id:'f24',cat:'fin',type:'tf',ch:25,q:'判断：发放股票股利会减少所有者权益总额。',o:['正确','错误'],a:[1],e:'错误。股票股利只是把未分配利润转为股本与资本公积，所有者权益总额不变，股数增加、每股收益下降。'},
{id:'f25',cat:'fin',type:'multi',ch:19,q:'下列属于普通股融资优点的有（　）。',o:['无固定股利负担','无到期日，不需偿还本金','增强公司信誉与举债能力','稀释原有股东控制权','资本成本较低'],a:[0,1,2],e:'前三项是优点；稀释控制权与资本成本高是缺点。普通股成本高于债务成本，因为股利不能抵税且股东要求风险溢价。'},
{id:'f26',cat:'fin',type:'multi',ch:20,q:'下列因素中，会影响加权平均资本成本的有（　）。',o:['债务资本成本','权益资本成本','资本结构（负债与权益比重）','所得税税率','固定资产折旧方法'],a:[0,1,2,3],e:'WACC = ΣWjKj，权重、各项资本成本、税率（通过税后债务成本）都会影响它；折旧方法影响会计利润，不直接进入 WACC。'},
{id:'a29',cat:'acct',type:'single',ch:14,q:'企业采购原材料，货款已付但货物尚在运输途中，应借记（　）。',
o:['原材料','在途物资','库存商品','主营业务成本'],a:[1],
e:'钱付了、货未到，所有权已归企业但实物未入库，先记「在途物资」；验收入库后再转入「原材料」。'},
{id:'a30',cat:'acct',type:'single',ch:14,q:'生产车间管理人员的工资应计入（　）。',
o:['生产成本','制造费用','管理费用','销售费用'],a:[1],
e:'车间管理人员不直接生产产品，其薪酬属于间接费用，先归集到「制造费用」，期末再分配计入生产成本。厂部行政人员才计入管理费用。'},
{id:'f27',cat:'fin',type:'single',ch:18,q:'采用销售百分比法，敏感资产占收入 40%，敏感负债占收入 15%，预计销售增加 1000 万元，则外部融资需求中来自资产与负债差额的部分为（　）。',o:['150 万元', '250 万元', '400 万元', '550 万元'],a:[1],e:'差额 = (40% − 15%) × 1000 = 250 万元，再扣除留存收益增加额才是最终 EFN。'},
{id:'f28',cat:'fin',type:'single',ch:18,q:'下列各项中，属于财务预算核心内容的是（　）。',o:['生产预算', '现金预算', '采购预算', '销售预算'],a:[1],e:'财务预算是关于资金取得与使用的预算，现金预算处于核心地位，直接反映现金余缺与筹资安排。'},
{id:'f29',cat:'fin',type:'tf',ch:18,q:'判断：其他条件不变时，提高股利支付率会增加外部融资需求。',o:['正确', '错误'],a:[0],e:'正确。留存收益 = 净利润 ×(1−d)，d 提高则内部积累减少，外部融资需求上升。'},
{id:'f30',cat:'fin',type:'single',ch:18,q:'企业所处行业进入衰退期、现金流紧张，宜采取的财务战略是（　）。',o:['扩张型', '稳健型', '防御型', '混合型'],a:[2],e:'防御型财务战略通过压缩投资、处置资产、降低负债来保住现金流。'},
{id:'f31',cat:'fin',type:'single',ch:22,q:'用自有厂房建设新项目，不支付租金，但该厂房原本可出租获得年租金 20 万元，这 20 万元属于（　）。',o:['沉没成本，不计入', '机会成本，应计入', '付现成本，应计入', '无关成本，不计入'],a:[1],e:'放弃的租金是资源他用收益，属于机会成本，必须计入项目现金流。'},
{id:'f32',cat:'fin',type:'single',ch:22,q:'两个互斥项目寿命期不同，最恰当的比较方法是（　）。',o:['直接比较净现值', '比较内含报酬率', '等额年金法（EAA）', '比较投资回收期'],a:[2],e:'寿命不等时直接比 NPV 会偏向寿命长的项目，等额年金法把 NPV 摊到每年，可比性更强。'},
{id:'f33',cat:'fin',type:'single',ch:22,q:'存在资本限额时，项目排序应优先依据（　）。',o:['净现值', '获利指数', '会计收益率', '投资回收期'],a:[1],e:'获利指数衡量单位投资带来的现值，在资金受限时能实现组合价值最大化。'},
{id:'f34',cat:'fin',type:'multi',ch:22,q:'下列属于风险投资决策方法的有（　）。',o:['敏感性分析', '情景分析', '决策树法', '风险调整折现率法', '杜邦分析'],a:[0, 1, 2, 3],e:'前四项都是处理项目风险的方法；杜邦分析是财务分析方法，与投资风险决策无关。'},
{id:'f35',cat:'fin',type:'single',ch:24,q:'信用条件为「2/10，n/30」，放弃现金折扣的资本成本约为（　）。',o:['12%', '24.5%', '36.7%', '48%'],a:[2],e:'放弃折扣成本 = (2%/98%)×(360/20) ≈ 36.7%，通常远高于银行短期借款利率。'},
{id:'f36',cat:'fin',type:'single',ch:24,q:'借款名义利率 10%，补偿性余额 20%，实际利率为（　）。',o:['10%', '12%', '12.5%', '15%'],a:[2],e:'实际利率 = 10% ÷ (1 − 20%) = 12.5%。'},
{id:'f37',cat:'fin',type:'tf',ch:24,q:'判断：周转信贷协定中，企业对未使用的额度通常需支付承诺费。',o:['正确', '错误'],a:[0],e:'正确。周转信贷协定是正式承诺，银行对未用部分收取承诺费，这是它与一般信用额度的主要区别。'},
{id:'f38',cat:'fin',type:'single',ch:24,q:'关于短期融资券，下列说法正确的是（　）。',o:['期限通常在 5 年以上', '成本通常高于银行短期借款', '对发行主体信用评级与信息披露要求较高', '只能由中小企业发行'],a:[2],e:'短期融资券期限在 1 年以内，成本通常低于银行贷款，但门槛高、披露要求严。'},
{id:'f39',cat:'fin',type:'single',ch:26,q:'两家同行业水泥企业合并，属于（　）。',o:['横向并购', '纵向并购', '混合并购', '杠杆收购'],a:[0],e:'同行业竞争者之间的并购为横向并购，目的在于扩大市场份额、形成规模效应。'},
{id:'f40',cat:'fin',type:'single',ch:26,q:'判断一项并购是否为股东创造价值，关键在于（　）。',o:['并购后企业规模是否扩大', '协同效应带来的增量价值是否大于支付的溢价', '是否采用现金支付', '目标公司是否上市'],a:[1],e:'并购创造价值的条件是协同增量 > 收购溢价；溢价付高了，再好的协同也会毁值。'},
{id:'f41',cat:'fin',type:'single',ch:26,q:'按 Z 计分模型，Z 值为 1.5 的企业属于（　）。',o:['安全区', '灰色区', '危险区', '无法判断'],a:[2],e:'Z > 2.99 安全区，1.81~2.99 灰色区，Z < 1.81 危险区，1.5 落在危险区。'},
{id:'f42',cat:'fin',type:'single',ch:26,q:'企业破产清算时，下列清偿顺序最靠前的是（　）。',o:['普通股东', '无担保债权人', '所欠税款', '清算费用'],a:[3],e:'清偿顺序：清算费用 → 职工工资与社保 → 税款 → 无担保债权 → 股东。'},
];

/* ---------- 状态：只保存在当前页面内存中，刷新即清空 ---------- */
var BS = { filter:'all', ans:{}, wrong:[] };
function bsave(){ /* 不写入浏览器存储：做题痕迹不留存 */ }
/* 清除旧版本遗留在本机的做题记录 */
try{
  ['kj_bank_ans','kj_bank_wrong','kj_master','kj_read','kj_last'].forEach(function(k){ localStorage.removeItem(k); });
}catch(e){}
function sameSet(a,b){
  if(!a || a.length!==b.length) return false;
  var x=a.slice().sort().join(','), y=b.slice().sort().join(',');
  return x===y;
}
function typeName(t){ return t==='single'?'单选':(t==='multi'?'多选':'判断'); }
function chName(c){ var v=c+1; return '第 '+(v<10?'0':'')+v+' 章'; }

function qCard(q, idx){
  var ans = BS.ans[q.id];
  var answered = !!ans;
  var ok = answered && sameSet(ans, q.a);
  var opts = q.o.map(function(t,i){
    var cls='qopt';
    if(answered){
      if(q.a.indexOf(i)>-1) cls+=' ok';
      else if(ans.indexOf(i)>-1) cls+=' no';
    }else if(q.type==='multi' && (q._sel||[]).indexOf(i)>-1){ cls+=' sel'; }
    return '<button type="button" class="'+cls+'" data-i="'+i+'"'+(answered?' disabled':'')+'>'
      +'<span class="oi">'+String.fromCharCode(65+i)+'</span><span>'+t+'</span></button>';
  }).join('');
  var act='';
  if(!answered && q.type==='multi'){
    act='<div class="qact"><button type="button" class="btn qsubmit" data-qid="'+q.id+'">提 交</button><span class="note">可多选，少选不得分</span></div>';
  }
  if(answered){
    act='<div class="qact"><button type="button" class="btn ghost qagain" data-qid="'+q.id+'">重 做</button><span class="note">'+(ok?'已答对':'已加入错题')+'</span></div>';
  }
  var exp='';
  if(answered){
    exp='<div class="qexp show'+(ok?'':' bad')+'"><b>'+(ok?'正 确':'错 误')+'</b>　正确答案：'+q.a.map(function(i){return String.fromCharCode(65+i);}).join('')+'<br>'+q.e+'</div>';
  }
  return '<div class="qcard" data-qid="'+q.id+'">'
    +'<div class="qmeta"><span class="qnum">'+(idx+1)+'</span><span class="tag'+(q.cat==='fin'?' fin':'')+'">'+(q.cat==='fin'?'财管':'会计')+'</span><span>'+chName(q.ch)+'</span><span>'+typeName(q.type)+'</span></div>'
    +'<div class="qstem">'+q.q+'</div>'
    +'<div class="qopts">'+opts+'</div>'
    +act+exp+'</div>';
}

function filtered(){
  return BANK.filter(function(q){
    if(BS.filter==='all') return true;
    if(BS.filter==='acct'||BS.filter==='fin') return q.cat===BS.filter;
    if(BS.filter==='single'||BS.filter==='multi'||BS.filter==='tf') return q.type===BS.filter;
    if(BS.filter==='wrong') return BS.wrong.indexOf(q.id)>-1;
    return true;
  });
}
function bankStats(){
  var done=0,right=0;
  BANK.forEach(function(q){
    if(BS.ans[q.id]){
      done++;
      if(sameSet(BS.ans[q.id],q.a)) right++;
    }
  });
  var rate = done ? Math.round(right/done*100)+'%' : '—';
  var el=function(id){return document.getElementById(id);};
  if(el('bDone')) el('bDone').textContent=done;
  if(el('bTotal')) el('bTotal').textContent=BANK.length;
  if(el('bRight')) el('bRight').textContent=right;
  if(el('bRate')) el('bRate').textContent=rate;
  if(el('cAll')) el('cAll').textContent=BANK.length;
  if(el('cAcct')) el('cAcct').textContent=BANK.filter(function(q){return q.cat==='acct';}).length;
  if(el('cFin')) el('cFin').textContent=BANK.filter(function(q){return q.cat==='fin';}).length;
  if(el('cWrong')) el('cWrong').textContent=BS.wrong.length;
  if(el('bFoot')) el('bFoot').textContent=BANK.length;
}
function renderBank(){
  var list=document.getElementById('bankList'); if(!list) return;
  var arr=filtered();
  if(!arr.length){
    list.innerHTML='<div class="bank-empty">这个筛选下还没有题目。做错的题会自动出现在「错题」里。</div>';
  }else{
    list.innerHTML=arr.map(function(q){ return qCard(q, BANK.indexOf(q)); }).join('');
  }
  bankStats();
}
function answerQ(qid, arr){
  var q=BANK.filter(function(x){return x.id===qid;})[0]; if(!q) return;
  var ok=sameSet(arr,q.a);
  BS.ans[qid]=arr.slice().sort();
  var wi=BS.wrong.indexOf(qid);
  if(!ok && wi<0) BS.wrong.push(qid);
  if(ok && wi>-1) BS.wrong.splice(wi,1);
  bsave();
  var old=document.querySelector('.qcard[data-qid="'+qid+'"]');
  if(old){
    var i=BANK.indexOf(q);
    old.outerHTML=qCard(q,i);
  }
  bankStats();
  toast(ok?'答对了':'已记入错题');
}
document.addEventListener('click', function(e){
  var opt=e.target.closest('.qopt');
  if(opt && !opt.disabled){
    var card=opt.closest('.qcard'); if(!card) return;
    var qid=card.getAttribute('data-qid');
    var q=BANK.filter(function(x){return x.id===qid;})[0]; if(!q) return;
    var i=+opt.getAttribute('data-i');
    if(q.type==='multi'){
      q._sel=q._sel||[];
      var p=q._sel.indexOf(i);
      if(p>-1) q._sel.splice(p,1); else q._sel.push(i);
      opt.classList.toggle('sel');
    }else{
      answerQ(qid,[i]);
    }
  }
  var sub=e.target.closest('.qsubmit');
  if(sub){
    var qid2=sub.getAttribute('data-qid');
    var q2=BANK.filter(function(x){return x.id===qid2;})[0];
    if(q2 && q2._sel && q2._sel.length) answerQ(qid2,q2._sel);
    else toast('请先选择答案');
  }
  var again=e.target.closest('.qagain');
  if(again){
    var qid3=again.getAttribute('data-qid');
    delete BS.ans[qid3];
    var q3=BANK.filter(function(x){return x.id===qid3;})[0];
    if(q3) q3._sel=[];
    bsave();
    var old3=document.querySelector('.qcard[data-qid="'+qid3+'"]');
    if(old3) old3.outerHTML=qCard(q3, BANK.indexOf(q3));
    bankStats();
  }
});
document.addEventListener('click', function(e){
  var chip=e.target.closest('#bankChips .chip');
  if(!chip) return;
  document.querySelectorAll('#bankChips .chip').forEach(function(c){c.classList.remove('active');});
  chip.classList.add('active');
  BS.filter=chip.getAttribute('data-f');
  renderBank();
});
document.addEventListener('click', function(e){
  if(e.target.id==='resetBank'){
    // 题库作答与错题
    BS.ans={}; BS.wrong=[]; BS.filter='all';
    BANK.forEach(function(q){ delete q._sel; });
    document.querySelectorAll('#bankChips .chip').forEach(function(c){c.classList.toggle('active', c.getAttribute('data-f')==='all');});
    renderBank();
    // 随堂小测
    document.querySelectorAll('.quiz').forEach(function(q){
      delete q.dataset.answered;
      q.querySelectorAll('.opt').forEach(function(o){ o.classList.remove('ok','no'); o.style.pointerEvents=''; });
      var fb=q.querySelector('.qfb'); if(fb){ fb.className='qfb'; fb.innerHTML=''; }
      var foot=q.querySelector('.quiz-foot'); if(foot) foot.remove();
    });
    // 简答背诵勾选
    if(typeof MASTER!=='undefined') MASTER.length=0;
    document.querySelectorAll('[data-master]').forEach(function(cb){ cb.checked=false; });
    toast('已清空本次做题痕迹');
  }
});
