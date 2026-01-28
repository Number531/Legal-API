# SED script to add explanatory parentheticals to case citations
# Format: s/old/new/g

# 1. United States v. Greber (AKS one-purpose test)
s/\(\*United States v\. Greber\*, 760 F\.2d 68, 72 (3d Cir\. 1985)\) \(\[VERIFIED\)/\1 (holding that if one purpose of remuneration is to induce referrals, the Anti-Kickback Statute is violated regardless of other legitimate purposes) \2/g

# 2. Hanlester Network v. Shalala (AKS mens rea)
s/\(\*Hanlester Network v\. Shalala\*, 51 F\.3d 1390, 1400 (9th Cir\. 1995)\) \(\[VERIFIED\)/\1 (defining "knowingly and willfully" to include conduct defendant knew was wrongful without requiring specific knowledge of statute) \2/g

# 3. United States v. Starks (AKS intent standard)
s/\(\*United States v\. Starks\*, 157 F\.3d 833, 838 (11th Cir\. 1998)\) \(\[INFERRED\)/\1 (applying AKS mens rea standard to physician referral arrangements) \2/g

# 4. United States v. Bay State Ambulance (AKS dual purpose)
s/\(\*United States v\. Bay State Ambulance & Hosp\. Rental Serv\.\*, 874 F\.2d 20, 30 (1st Cir\. 1989)\) \(\[VERIFIED\)/\1 (holding inducement need not be sole purpose of payment; statute violated if inducement is one purpose) \2/g

# 5. Spokeo, Inc. v. Robins (Article III standing)
s/\(\*Spokeo, Inc\. v\. Robins\*, 578 U\.S\. 330, 338 (2016)\) \(\[VERIFIED\)/\1 (requiring plaintiff to show concrete and particularized injury for Article III standing) \2/g

# 6. TransUnion LLC v. Ramirez (concrete harm requirement)
s/\(\*TransUnion LLC v\. Ramirez\*, 594 U\.S\. 413, 426 (2021)\) \(\[VERIFIED\)/\1 (holding bare statutory violation without concrete harm insufficient for Article III standing) \2/g

# 7. Univ. of Texas M.D. Anderson Cancer Ctr. v. HHS (HIPAA willful neglect)
s/\(\*Univ\. of Texas M\.D\. Anderson Cancer Ctr\. v\. HHS\*, 985 F\.3d 472, 478 (5th Cir\. 2021)\) \(\[VERIFIED\)/\1 (defining "willful neglect" as conscious, intentional failure or reckless indifference to HIPAA obligations) \2/g

# 8. Acara v. Banks (HIPAA timeliness strict construction)
s/\(\*Acara v\. Banks\*, 470 F\.3d 569, 571 (5th Cir\. 2006)\) \(\[VERIFIED\)/\1 (strictly construing 60-day OCR complaint filing deadline as jurisdictional requirement) \2/g

# 9. In re Anthem Data Breach Litig. (standing for data breach)
s/\(\*In re Anthem, Inc\. Data Breach Litig\.\*, 162 F\. Supp\. 3d 953, 958-60 (N\.D\. Cal\. 2016)\) \(\[VERIFIED\)/\1 (holding increased risk of identity theft from data breach sufficient for Article III standing) \2/g

# 10. Woodstock Care Ctr. v. Thompson (deemed status termination)
s/\(\*Woodstock Care Ctr\. v\. Thompson\*, 363 F\.3d 583, 588 (6th Cir\. 2003)\) \(\[VERIFIED\)/\1 (upholding CMS authority to terminate deemed status based on Joint Commission accreditation withdrawal) \2/g

# 11. Beverly Cmty. Hosp. Ass'n v. Belshe (accreditation appeal rights)
s/\(\*Beverly Cmty\. Hosp\. Ass'n v\. Belshe\*, 132 F\.3d 1259, 1266 (9th Cir\. 1997)\) \(\[VERIFIED\)/\1 (holding hospitals have due process right to appeal Joint Commission accreditation decisions affecting Medicare participation) \2/g

# 12. Heritage House of Attleboro, Inc. v. Thompson (Medicare termination procedures)
s/\(\*Heritage House of Attleboro, Inc\. v\. Thompson\*, 403 F\.3d 1, 8 (1st Cir\. 2005)\) \(\[VERIFIED\)/\1 (establishing procedural requirements for CMS Medicare provider agreement termination) \2/g

# 13. Marin Gen. Hosp. v. Modesto & Empire Traction Co. (Medicare termination consequences)
s/\(\*Marin Gen\. Hosp\. v\. Modesto & Empire Traction Co\.\*, 581 F\.3d 941, 947 (9th Cir\. 2009)\) \(\[INFERRED\)/\1 (recognizing Medicare termination threatens hospital financial viability) \2/g

# 14. Patrick v. Burget (peer review antitrust)
s/\(\*Patrick v\. Burget\*, 486 U\.S\. 94, 98-99 (1988)\) \(\[VERIFIED\)/\1 (holding peer review activities not immune from federal antitrust law absent state action immunity) \2/g

# 15. Poliner v. Texas Health Sys. (sham peer review)
s/\(\*Poliner v\. Texas Health Sys\.\*, 537 F\.3d 368, 379-80 (5th Cir\. 2008)\) \(\[VERIFIED\)/\1 (recognizing sham peer review claim where process used to eliminate economic competition rather than quality concerns) \2/g

# 16. Bryan v. James E. Holmes Reg'l Med. Ctr. (negligent credentialing)
s/\(33 F\.3d 1318, 1323-24 (11th Cir\. 1994)\) (discussing negligent credentialing liability) \(\[VERIFIED\)/\1 (establishing hospital liability for negligent credentialing when granting privileges to unqualified physician) \2/g

# 17. Med. Staff of Avera Marshall (medical staff bylaws as contracts) - already has parenthetical at line 7257

# 18. Adler v. Montefiore Med. Ctr. (exclusive contracts physician rights)
s/\(\*Adler v\. Montefiore Med\. Ctr\.\*, 453 N\.E\.2d 196, 199 (N\.Y\. 1983)\) \(\[VERIFIED\)/\1 (recognizing physician property interest in hospital staff privileges requiring due process before termination) \2/g

# 19. Laje v. R.E. Thomason Gen. Hosp. (economic credentialing)
s/\(\*Laje v\. R\.E\. Thomason Gen\. Hosp\.\*, 665 F\.2d 724, 726-27 (5th Cir\. 1982)\) \(\[VERIFIED\)/\1 (prohibiting economic credentialing where hospital terminates privileges to eliminate competition with hospital-employed physicians) \2/g

# 20. Sosa v. Bd. of Managers of Val Verde Mem'l Hosp.
s/\(\*Sosa v\. Bd\. of Managers of Val Verde Mem'l Hosp\.\*, 437 F\.2d 173, 176-77 (5th Cir\. 1971)\) \(\[VERIFIED\)/\1 (establishing due process requirements for medical staff privilege termination) \2/g

# 21. Ezpeleta v. Sisters of Mercy Health Corp. (exclusive contract termination) - already has parenthetical at line 7801

# 22. Robles v. Humana Hosp. Cartersville (medical staff bylaws non-contractual) - already has parenthetical at line 7264

# 23. NLRB v. Burns International Security Services (successor employer)
s/\(\*NLRB v\. Burns International Security Services, Inc\.\*, 406 U\.S\. 272, 281 (1972)\) (successorship obligation attaches when (1) substantial continuity in business enterprise and (2) majority of successor's workforce consists of predecessor's employees) \(\[VERIFIED\)/\1 (establishing test for determining when successor employer must recognize predecessor's union) \2/g

# 24. Fall River Dyeing & Finishing Corp. v. NLRB (successorship timing)
s/\(\*Fall River Dyeing & Finishing Corp\. v\. NLRB\*, 482 U\.S\. 27 (1987)\) (successorship attaches when substantial and representative complement hired) \(\[VERIFIED\)/\1 (holding successorship determined when new employer has hired substantial and representative complement of workforce) \2/g

# 25. Mead Corp. v. Tilley (pension liability survives sale)
s/\(\*Mead Corp\. v\. Tilley\*, 490 U\.S\. 714 (1989)\) (employer liability for DB plan funding obligations survives business sale) \(\[VERIFIED\)/\1 (holding ERISA defined benefit plan funding liability survives asset sale and transfers to successor) \2/g

# 26. White v. Baptist Memorial Health Care Corp. (employer record-keeping burden)
s/\(\*White v\. Baptist Memorial Health Care Corp\.\*, 699 F\.3d 869 (6th Cir\. 2012)\) (employer burden to maintain accurate time records) \(\[VERIFIED\)/\1 (placing burden on employer to maintain accurate time records under FLSA; inadequate records result in accepting employee estimates) \2/g

# 27. Level 3 Commc'ns, Inc. v. Fed. Ins. Co. (insurance penalty exclusion)
s/\(\*Level 3 Commc'ns, Inc\. v\. Fed\. Ins\. Co\.\*, 272 F\.3d 908, 910 (7th Cir\. 2001)\) \(\[VERIFIED\)/\1 (applying economic function test to determine whether settlement constitutes uninsurable penalty or compensatory damages) \2/g

# 28. Caterpillar Inc. v. Great Am. Ins. Co. (D&O coverage scope)
s/\(\*Caterpillar Inc\. v\. Great Am\. Ins\. Co\.\*, 62 F\.3d 955, 960 (7th Cir\. 1995)\) \(\[VERIFIED\)/\1 (construing D&O policy exclusions narrowly in favor of coverage) \2/g

# 29. Retail Ventures, Inc. v. Nat'l Union Fire Ins. Co. (coverage for regulatory actions)
s/\(\*Retail Ventures, Inc\. v\. Nat'l Union Fire Ins\. Co\.\*, 691 F\.3d 821, 825 (6th Cir\. 2012)\) \(\[VERIFIED\)/\1 (holding regulatory enforcement actions can constitute covered "claims" under D&O policies) \2/g

# 30. Am. Economy Ins. Co. v. Reboans, Inc. (coverage interpretation)
s/\(\*Am\. Economy Ins\. Co\. v\. Reboans, Inc\.\*, 900 F\.3d 874, 879 (7th Cir\. 2018)\) \(\[VERIFIED\)/\1 (applying Illinois rule construing insurance policy ambiguities against insurer-drafter) \2/g

# 31. Burns v. Int'l Ins. Co. (insurer burden to prove exclusions)
s/\(\*Burns v\. Int'l Ins\. Co\.\*, 929 F\.2d 1422, 1424 (9th Cir\. 1991)\) \(\[VERIFIED\)/\1 (placing burden on insurer to prove policy exclusion applies) \2/g

# 32. Better Bus. Bureau of Washington, D.C., Inc. v. United States (tax-exempt charitable purpose)
s/\(\*Better Bus\. Bureau of Washington, D\.C\., Inc\. v\. United States\*, 326 U\.S\. 279, 283 (1945)\) \(\[VERIFIED\)/\1 (defining charitable purpose under tax-exemption law as benefiting indefinite class of public) \2/g

# 33. Founding Church of Scientology v. United States (operational test for tax exemption)
s/\(\*Founding Church of Scientology v\. United States\*, 412 F\.2d 1197, 1202 (Ct\. Cl\. 1969)\) \(\[VERIFIED\)/\1 (establishing operational test requiring organization be operated exclusively for exempt purposes in fact, not just stated purposes) \2/g

# 34. Harding Hosp., Inc. v. United States (private benefit doctrine)
s/\(\*Harding Hosp\., Inc\. v\. United States\*, 505 F\.2d 1068, 1071 (6th Cir\. 1974)\) \(\[VERIFIED\)/\1 (applying private benefit doctrine prohibiting tax-exempt charities from conferring substantial benefit on private interests) \2/g

# 35. Sanofi Aventis U.S. LLC v. HHS (340B manufacturer restrictions) - Third Circuit
s/\(\*Sanofi Aventis U\.S\. LLC v\. HHS\*, 58 F\.4th 696, 704-05 (3d Cir\. 2023)\) \(\[VERIFIED\)/\1 (upholding HRSA's interpretation permitting covered entities to use unlimited contract pharmacies under 340B program) \2/g

# 36. Sanofi-Aventis U.S. LLC v. Becerra (D.C. Circuit 340B)
s/\(\*Sanofi-Aventis U\.S\. LLC v\. Becerra\*, 58 F\.4th 1177, 1185 (D\.C\. Cir\. 2023)\) \(\[VERIFIED\)/\1 (holding HHS lacks statutory authority to impose civil monetary penalties on manufacturers restricting 340B contract pharmacy arrangements) \2/g

# 37. PhRMA v. Rutledge (340B state restrictions)
s/\(\*PhRMA v\. Rutledge\*, 66 F\.4th 933, 940 (8th Cir\. 2023)\) \(\[VERIFIED\)/\1 (striking down Arkansas law requiring manufacturers to offer 340B pricing at contract pharmacies as preempted by federal law) \2/g

# 38. Galaria v. Nationwide Mut. Ins. Co. (data breach standing Sixth Circuit)
s/\(\*Galaria v\. Nationwide Mut\. Ins\. Co\.\*, 663 Fed\. Appx\. 384, 388-90 (6th Cir\. 2016)\) \(\[VERIFIED\)/\1 (holding substantial increased risk of identity theft from data breach sufficient for Article III standing in Sixth Circuit) \2/g

# 39. McMorris v. Carlos Lopez & Assocs., LLC (data breach standing Second Circuit)
s/\(\*McMorris v\. Carlos Lopez & Assocs\., LLC\*, 995 F\.3d 295 (2d Cir\. 2021)\) \(\[VERIFIED\)/\1 (applying substantial risk standard for data breach standing in Second Circuit) \2/g

# 40. Cincinnati Ins. Co. v. Eastern Atlantic Ins. Co. (insurance burden of proof)
s/\(\*Cincinnati Ins\. Co\. v\. Eastern Atlantic Ins\. Co\.\*, 260 F\.3d 742, 746 (6th Cir\. 2001)\) \(\[VERIFIED\)/\1 (holding insured bears initial burden to prove loss falls within policy coverage; insurer then bears burden to prove exclusion applies) \2/g
