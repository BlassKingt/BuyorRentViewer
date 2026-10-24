# Task2 UI brief

Read design, plan and model-report. Use existing React/Vite/Phosphor, no new runtime dependencies. User already approves design and says start. Only implementation agent edits UI/browser tests. Do not edit model unless report blocker to controller.

## UX contract
- Header 买或租 / HOUSING LAB. Interesting but calm original anime research lab, pale lavender/white background, ink navy, teal buy, lavender rent. Avoid enormous empty landing area: intro with mascot at right and beginning calculator visible at1440x1080.
- Hero image `./mascot/researcher-v1.png`; chibi `./mascot/researcher-chibi-v1.png`, use `import.meta.env.BASE_URL` for relative deployments. Both are available; no handdrawn placeholder.
- Subheading "把住房选择，算明白。" with small policy/local-only badges. Mode own/rental segmented controls preserve both inputs.
- Main two-column parameter workbench and sticky results. Mobile stack with no horizontal overflow.
- Initial numeric controls price + rent OR rentalNetMonthly. Small disclosure of default1.5% rate. Default5years, sell with assumed price unchanged and1% fee visible; expand to years/additionalMonths (months max11), presets24/60/120. No optional time switch.
- Progressive loan/fund/costs remain. Loan presets3/2.6 and custom effective field, 15years. Do not imply account balance automatically determines maximumloan. Existing fund options and limitations preserved; rent withdrawal option disabled/explained in rental purpose.
- Rental detail controls net/details, rentalMonthsPerYear etc. Negative net allowed. Target rental yield displayed and self-use optional estimation uses same rental fields but NEVER actual cashflow; invalid optional estimation just shows unavailable, should not crash result.
- Exit details: sell/hold, saleChange totalperiod notannual, fee percentage and fixedcost, automaticShanghai vsmanual total tax, unknown/confirmed/noteligible exemption, deductible amount, surcharge default12% with clearconditionalnote (6% if eligible through2027 only). Policyhelp fulltwo/five, notguaranteedexit, date and source links. Notfulltaxservice. Purchase/hold fees default0 labelled未填.
- Numeric invaliddrafts persist on collapse; active invalid blocks results; inactive invalid ignored. Mode selectors and shortcuts clear drafts only for fields they update; never reset other user values.
- Result primary totalnetdifference with qualifiers; show ordinarycash separate from PF, holdingpropertyequity separately when applicable. For sell plainlabel "假设成交后的净资产" and no second debtsubtract. Labels cannot call totalinclusivePF全部到手.
- AssetChart must handle monthly horizons (1month,23months) safely, samplefinalmonth, integer month scrubbing. Intermediate values are bookvalue; finalpoint is sale-net. Explicitly label discontinuity/assumption so taxfees aren't unexplainedmarketcrash.
- Contribution chart exactpositive/negative amount rows sorted, sum check display "合计=差额"; explain it's ledgernotcausalparameterimportance. In result teaser name strongestpositive&negative actualnonzero.
- Scan expandable or analysisdrawer; show actualranges units and ±percentagepoint distinction, span ranking notshare, fixedotherconditions, ownincome vsrentalmode labels. Results use same modelcall, nohardcodednumbers.
- Assistant state: hide/show, disablemotion, button opens samepage analysisnotes, contains deterministic explanation. Respectreducedmotion. Noautoplayaudio/cursorchange/floatingobstruction, nofalseAIlabel.
- Footer local-only financial simulation; policy and model scope accessible.

## Tests
Update old7browser tests to newsemantics; add rentalnet/details, switchedinputpreservation, policy24/60, funds/costs, manualtaxoverride, invalid input and collapsedactive invalid, fractionalyear/month chart, scan, imagecomplete/naturalWidth, assistant hide/motion, 390wide mobile, axe base+extended. Run targeted failing test first on oldUI. Verify build and browser suite. Screenshot desktop andmobile and report paths.

Write docs/superpowers/ui-report.md with files, API use, tests, limitations. Do not spawn subagents, commit, deploy, or alter source outside calculator.
