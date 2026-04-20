import svgPaths from "./svg-tm7bavnpq2";
import imgGeminiGeneratedImage34Zs6Y34Zs6Y34Zs1 from "./d192986159fe719d75777dd727618e21ceb3afbd.png";
import imgImage1 from "./c4bf1212585b18a4569515806f6796c259f4093a.png";
import imgLogo from "./ba68d9daa8339b44055d4c1aa7f434ea987c807e.png";

function ChevronRight() {
  return (
    <div className="relative shrink-0 size-[10.891px]" data-name="chevron-right">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.8908 10.8908">
        <g id="chevron-right">
          <path clipRule="evenodd" d={svgPaths.pc1e32f0} fill="var(--fill-0, #24E795)" fillRule="evenodd" id="Path (Stroke)" />
        </g>
      </svg>
    </div>
  );
}

function Elements() {
  return (
    <div className="content-stretch flex gap-[7.779px] items-center relative shrink-0" data-name="elements">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[10.891px] not-italic relative shrink-0 text-[#24e795] text-[10.89px] whitespace-nowrap">Export</p>
      <ChevronRight />
    </div>
  );
}

function Header1() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="header">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold h-[26px] leading-[19.448px] not-italic relative shrink-0 text-[16px] text-white w-[271px]">Statistiques</p>
      <div className="content-stretch flex flex-col h-[20.226px] items-center relative shrink-0" data-name="x-button">
        <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="btn/solid/large">
          <div className="bg-[rgba(255,255,255,0.25)] content-stretch flex flex-col items-center px-[18.67px] py-[12.447px] relative rounded-[50px] shrink-0" data-name="btn/large">
            <Elements />
          </div>
        </div>
      </div>
    </div>
  );
}

function Elements1() {
  return (
    <div className="content-stretch flex gap-[7.779px] items-center relative shrink-0" data-name="elements">
      <div className="relative shrink-0 size-[6.223px]" data-name="tag/indicator">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.22331 6.22331">
          <circle cx="3.11166" cy="3.11166" fill="var(--fill-0, #24E795)" id="indicator" r="3.11166" />
        </svg>
      </div>
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[7.262px] not-italic relative shrink-0 text-[10.11px] text-white whitespace-nowrap">Trésorerie</p>
    </div>
  );
}

function Tag() {
  return (
    <div className="content-stretch flex gap-[18.67px] items-center relative shrink-0" data-name="tag">
      <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="tag/base">
        <Elements1 />
      </div>
    </div>
  );
}

function Elements2() {
  return (
    <div className="content-stretch flex gap-[7.779px] items-center relative shrink-0" data-name="elements">
      <div className="relative shrink-0 size-[6.223px]" data-name="tag/indicator">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.22331 6.22331">
          <circle cx="3.11166" cy="3.11166" fill="var(--fill-0, #E72424)" id="indicator" r="3.11166" />
        </svg>
      </div>
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[7.262px] not-italic relative shrink-0 text-[10.11px] text-white whitespace-nowrap">Burn rate</p>
    </div>
  );
}

function Tag1() {
  return (
    <div className="content-stretch flex gap-[18.67px] items-center relative shrink-0 w-[116.687px]" data-name="tag">
      <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="x-tag">
        <div className="content-stretch flex flex-col items-center py-[2.334px] relative shrink-0" data-name="tag/base">
          <Elements2 />
        </div>
      </div>
    </div>
  );
}

function BodyText() {
  return (
    <div className="content-stretch flex gap-[18.67px] items-center relative shrink-0 w-[343.838px]" data-name="body-text">
      <Tag />
      <Tag1 />
    </div>
  );
}

function Header() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start justify-center relative shrink-0 w-full" data-name="header">
      <Header1 />
      <BodyText />
    </div>
  );
}

function Statistics() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold items-start justify-between leading-[0] min-h-px min-w-px not-italic relative text-[#425466] text-[7.779px] tracking-[-0.0389px]" data-name="statistics">
      <div className="flex flex-col h-[12.447px] justify-end relative shrink-0 w-[13.225px]">
        <p className="leading-[7.779px]">5k</p>
      </div>
      <div className="flex flex-col h-[12.447px] justify-end relative shrink-0 w-[14.002px]">
        <p className="leading-[7.779px]">4k</p>
      </div>
      <div className="flex flex-col h-[11.669px] justify-end relative shrink-0 w-[14.002px]">
        <p className="leading-[7.779px]">3k</p>
      </div>
      <div className="flex flex-col h-[12.447px] justify-end relative shrink-0 w-[13.225px]">
        <p className="leading-[7.779px]">2k</p>
      </div>
      <div className="flex flex-col h-[12.447px] justify-end relative shrink-0 w-[11.669px]">
        <p className="leading-[7.779px]">1k</p>
      </div>
    </div>
  );
}

function VerticalStats() {
  return (
    <div className="h-full relative shrink-0" data-name="vertical stats">
      <div className="flex flex-col justify-end size-full">
        <div className="content-stretch flex flex-col h-full items-start justify-end pb-[18.67px] pr-[6.223px] relative">
          <Statistics />
        </div>
      </div>
    </div>
  );
}

function Charts() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="charts">
      <div className="absolute inset-[-2.14%_0_0_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1348.49 167.843">
          <g id="charts">
            <path d={svgPaths.p4e30960} id="chart" stroke="var(--stroke-0, #E72424)" strokeWidth="2.33374" />
            <path d={svgPaths.p265e6600} id="chart_2" stroke="var(--stroke-0, #24E795)" strokeWidth="2.33374" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function UnderlineSats() {
  return (
    <div className="content-stretch flex font-['Inter:Semi_Bold',sans-serif] font-semibold items-center justify-between leading-[0] not-italic relative shrink-0 text-[#8492a6] text-[7.779px] tracking-[-0.0389px] w-full whitespace-nowrap" data-name="underline sats">
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[7.779px]">1k</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[7.779px]">2k</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[7.779px]">3k</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[7.779px]">4k</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[7.779px]">5k</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[7.779px]">6k</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[7.779px]">7k</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[7.779px]">8k</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[7.779px]">9k</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[7.779px]">10k</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[7.779px]">11k</p>
      </div>
      <div className="flex flex-col justify-end relative shrink-0">
        <p className="leading-[7.779px]">12k</p>
      </div>
    </div>
  );
}

function ChartHorizontalStats() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[9.335px] h-full items-start min-h-px min-w-px relative" data-name="chart + horizontal stats">
      <Charts />
      <UnderlineSats />
    </div>
  );
}

function ChartStats() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[14.002px] items-start min-h-px min-w-px relative w-full" data-name="chart + stats">
      <VerticalStats />
      <ChartHorizontalStats />
    </div>
  );
}

function CardChartLine() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.25)] content-stretch flex flex-col gap-[23.337px] h-[293px] items-start left-[448px] p-[18.67px] rounded-[12.447px] shadow-[0px_0px_0.778px_0px_rgba(12,26,75,0.24),0px_2.334px_6.223px_0px_rgba(50,50,71,0.05)] top-[691px] w-[1420px]" data-name="card-chart/line/1">
      <Header />
      <ChartStats />
    </div>
  );
}

function Bg() {
  return (
    <div className="absolute contents left-0 top-[0.01px]" data-name="BG">
      <div className="absolute flex h-[1080px] items-center justify-center left-0 top-[0.01px] w-[368px]" style={{ "--transform-inner-width": "1185", "--transform-inner-height": "21" } as React.CSSProperties}>
        <div className="flex-none rotate-90">
          <div className="h-[368px] pointer-events-none relative w-[1080px]" data-name="image 1">
            <div className="absolute inset-0 overflow-hidden">
              <img alt="" className="absolute h-[323.7%] left-[-52.55%] max-w-none top-[-59.22%] w-[199.38%]" src={imgImage1} />
            </div>
            <div className="absolute inset-0 rounded-[inherit] shadow-[inset_-26px_-137px_236.8px_117px_black]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-[rgba(255,255,255,0.25)] h-[46px] relative rounded-[18px] shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center pl-[82px] pr-[84px] py-[27px] relative size-full">
          <p className="font-['Unageo:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[24px] text-center text-white whitespace-nowrap">CLIENTS</p>
        </div>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-[rgba(255,255,255,0.25)] h-[46px] relative rounded-[18px] shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center pl-[82px] pr-[84px] py-[27px] relative size-full">
          <p className="font-['Unageo:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[24px] text-center text-white whitespace-nowrap">VITAUX</p>
        </div>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="bg-[rgba(255,255,255,0.25)] h-[46px] relative rounded-[18px] shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center pl-[82px] pr-[84px] py-[27px] relative size-full">
          <p className="font-['Unageo:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[24px] text-center text-white whitespace-nowrap">VITAUX</p>
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-[rgba(255,255,255,0.25)] h-[46px] relative rounded-[18px] shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center pl-[82px] pr-[84px] py-[27px] relative size-full">
          <p className="font-['Unageo:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[24px] text-center text-white whitespace-nowrap">VITAUX</p>
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-[rgba(255,255,255,0.25)] h-[46px] relative rounded-[18px] shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center pl-[82px] pr-[84px] py-[27px] relative size-full">
          <p className="font-['Unageo:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[24px] text-center text-white whitespace-nowrap">VITAUX</p>
        </div>
      </div>
    </div>
  );
}

function Menu1() {
  return (
    <div className="content-stretch flex flex-col gap-[14px] items-start justify-center relative shrink-0 w-[252px]" data-name="Menu">
      <Frame1 />
      <Frame2 />
      <Frame3 />
      <Frame4 />
      <Frame5 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex flex-col gap-[33px] items-center relative shrink-0 w-[301.182px]">
      <div className="aspect-[780/320] relative shrink-0 w-full" data-name="Logo">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgLogo} />
      </div>
      <Menu1 />
    </div>
  );
}

function Menu() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] content-stretch flex gap-[10px] h-[1080.006px] items-start justify-center left-0 px-[30px] py-[17px] shadow-[5px_0px_21px_0px_rgba(0,0,0,0.8)] top-[-0.01px] w-[368px]" data-name="Menu">
      <Bg />
      <Frame6 />
    </div>
  );
}

function TextHeading() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="Text Heading">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[32px] text-center text-white tracking-[-0.64px] whitespace-nowrap">Revenus mensuels :</p>
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[24px] text-center text-white tracking-[-0.48px] whitespace-nowrap">174 000.-</p>
    </div>
  );
}

function ReviewBody() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full" data-name="Review Body">
      <TextHeading />
      <Text />
    </div>
  );
}

function StatsCard() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.3)] content-stretch flex flex-col gap-[24px] items-center left-[448px] min-w-[240px] p-[24px] rounded-[8px] shadow-[0px_0px_20px_0px_rgba(36,231,149,0.5)] top-[174px] w-[406px]" data-name="Stats Card">
      <ReviewBody />
    </div>
  );
}

function TextHeading1() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text Heading">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[32px] text-center text-white tracking-[-0.64px] whitespace-nowrap">Burn rate :</p>
    </div>
  );
}

function Text1() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[24px] text-center text-white tracking-[-0.48px] whitespace-nowrap">47 000.-</p>
    </div>
  );
}

function ReviewBody1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-[141px]" data-name="Review Body">
      <TextHeading1 />
      <Text1 />
    </div>
  );
}

function TextHeading2() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text Heading">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[32px] text-center text-white tracking-[-0.64px] whitespace-nowrap">Burn rate m-1 :</p>
    </div>
  );
}

function Text2() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[24px] text-center text-white tracking-[-0.48px] whitespace-nowrap">44 000.-</p>
    </div>
  );
}

function ReviewBody2() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-[196px]" data-name="Review Body">
      <TextHeading2 />
      <Text2 />
    </div>
  );
}

function StatsCard1() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.3)] content-stretch flex gap-[24px] items-center justify-center left-[448px] min-w-[240px] p-[24px] rounded-[8px] top-[327px]" data-name="Stats Card">
      <ReviewBody1 />
      <div className="flex flex-row items-center self-stretch">
        <div className="h-full relative shrink-0 w-0" data-name="sep">
          <div className="absolute inset-[0_-1.5px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 71">
              <path d="M1.5 0V71" id="sep" stroke="var(--stroke-0, #E72424)" strokeOpacity="0.5" strokeWidth="3" />
            </svg>
          </div>
        </div>
      </div>
      <ReviewBody2 />
    </div>
  );
}

function TextHeading3() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text Heading">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[32px] text-center text-white tracking-[-0.64px] whitespace-nowrap">Trésorerie :</p>
    </div>
  );
}

function Text3() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[24px] text-center text-white tracking-[-0.48px] whitespace-nowrap">327 000.-</p>
    </div>
  );
}

function ReviewBody3() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-[148px]" data-name="Review Body">
      <TextHeading3 />
      <Text3 />
    </div>
  );
}

function TextHeading4() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text Heading">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[32px] text-center text-white tracking-[-0.64px] whitespace-nowrap">Trésorerie m-1 :</p>
    </div>
  );
}

function Text4() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[24px] text-center text-white tracking-[-0.48px] whitespace-nowrap">314 000.-</p>
    </div>
  );
}

function ReviewBody4() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-[204px]" data-name="Review Body">
      <TextHeading4 />
      <Text4 />
    </div>
  );
}

function StatsCard2() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.3)] content-stretch flex gap-[24px] items-center justify-center left-[923px] min-w-[240px] p-[24px] rounded-[8px] top-[327px]" data-name="Stats Card">
      <ReviewBody3 />
      <div className="flex flex-row items-center self-stretch">
        <div className="h-full relative shrink-0 w-0" data-name="sep">
          <div className="absolute inset-[0_-1.5px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 71">
              <path d="M1.5 0V71" id="sep" stroke="var(--stroke-0, #24E795)" strokeOpacity="0.5" strokeWidth="3" />
            </svg>
          </div>
        </div>
      </div>
      <ReviewBody4 />
    </div>
  );
}

function TextHeading5() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text Heading">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[32px] text-center text-white tracking-[-0.64px] whitespace-nowrap">Dépenses mensuels :</p>
    </div>
  );
}

function Text5() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[24px] text-center text-white tracking-[-0.48px] whitespace-nowrap">89 000.-</p>
    </div>
  );
}

function ReviewBody5() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full" data-name="Review Body">
      <TextHeading5 />
      <Text5 />
    </div>
  );
}

function StatsCard3() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.3)] content-stretch flex flex-col gap-[24px] items-center left-[902px] min-w-[240px] p-[24px] rounded-[8px] shadow-[0px_0px_20px_0px_rgba(231,36,36,0.5)] top-[174px] w-[406px]" data-name="Stats Card">
      <ReviewBody5 />
    </div>
  );
}

function TextHeading6() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text Heading">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[32px] text-center text-white tracking-[-0.64px] whitespace-nowrap">Marges brut mensuels :</p>
    </div>
  );
}

function Text6() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[24px] text-center text-white tracking-[-0.48px] whitespace-nowrap">85 000.-</p>
    </div>
  );
}

function ReviewBody6() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full" data-name="Review Body">
      <TextHeading6 />
      <Text6 />
    </div>
  );
}

function StatsCard4() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.3)] content-stretch flex flex-col gap-[24px] items-center left-[1356px] min-w-[240px] p-[24px] rounded-[8px] top-[176px] w-[406px]" data-name="Stats Card">
      <ReviewBody6 />
    </div>
  );
}

function TextHeading7() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0" data-name="Text Heading">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[32px] text-center text-white tracking-[-0.64px] whitespace-nowrap">Runway :</p>
    </div>
  );
}

function Text7() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="Text">
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[24px] text-center text-white tracking-[-0.48px] whitespace-nowrap">85 000.-</p>
    </div>
  );
}

function ReviewBody7() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full" data-name="Review Body">
      <TextHeading7 />
      <Text7 />
    </div>
  );
}

function StatsCard5() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.3)] content-stretch flex flex-col gap-[24px] items-center left-[1417px] min-w-[240px] p-[24px] rounded-[8px] top-[327px] w-[240px]" data-name="Stats Card">
      <ReviewBody7 />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-white relative size-full">
      <div className="absolute h-[1111px] left-0 top-0 w-[2037px]" data-name="Gemini_Generated_Image_34zs6y34zs6y34zs 1">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgGeminiGeneratedImage34Zs6Y34Zs6Y34Zs1} />
      </div>
      <p className="-translate-x-1/2 absolute font-['Unageo:SemiBold',sans-serif] h-[57px] leading-[normal] left-[696.5px] not-italic text-[48px] text-[rgba(255,255,255,0.75)] text-center top-[77px] w-[317px]">DASHBOARD</p>
      <CardChartLine />
      <Menu />
      <StatsCard />
      <StatsCard1 />
      <StatsCard2 />
      <StatsCard3 />
      <StatsCard4 />
      <StatsCard5 />
    </div>
  );
}