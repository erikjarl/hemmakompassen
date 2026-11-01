// Hemmakompassen: original IPIP-50 / självständig preliminär svensk översättning.
// INTE Bäckströms översättning. Originalfrågor: public domain (IPIP).
// Ändra aldrig frågor/nyckel under detta instrument-ID: skapa en ny version.
// All normjämförelse med svensk text/ungdom är avstängd.
export const IPIP50_V1 = {
  "id": "ipip50-sv-v1",
  "version": "1.0.0",
  "language": "sv-SE",
  "status": "draft_translation_not_validated",
  "origin": "IPIP Big-Five Factor Markers 50-item sample questionnaire, Lewis R. Goldberg",
  "license": "English IPIP original: public domain. Swedish wording here independently translated by Hemmakompassen; review required before validation claims.",
  "instructionsSv": "Beskriv hur du brukar vara just nu, inte hur du önskar att du vore. Välj hur väl varje påstående stämmer på dig.",
  "responseOptions": [
    {
      "value": 1,
      "label": "Stämmer inte alls"
    },
    {
      "value": 2,
      "label": "Stämmer ganska dåligt"
    },
    {
      "value": 3,
      "label": "Varken eller"
    },
    {
      "value": 4,
      "label": "Stämmer ganska bra"
    },
    {
      "value": 5,
      "label": "Stämmer mycket bra"
    }
  ],
  "scoreRange": {
    "min": 10,
    "max": 50,
    "itemsPerFactor": 10
  },
  "sources": {
    "items": "https://ipip.ori.org/new_ipip-50-item-scale.htm",
    "key": "https://ipip.ori.org/newBigFive5broadKey.htm",
    "scoring": "https://ipip.ori.org/newScoringInstructions.htm",
    "norms": "https://ipip.ori.org/newNorms.htm"
  },
  "warnings": [
    "Independent Swedish translation, not an established validated Swedish adaptation.",
    "Do not report normative Swedish percentiles or score cutoffs.",
    "Wording was made accessible, but comprehension/measurement invariance in ages 13–17 remains untested.",
    "All item responses are private by default; sharing requires an explicit separately implemented agreement."
  ],
  "factors": [
    {
      "id": "extraversion",
      "labelSv": "Extraversion",
      "labelEn": "Extraversion",
      "alphaOriginal": 0.87
    },
    {
      "id": "agreeableness",
      "labelSv": "Vänlighet och omtanke",
      "labelEn": "Agreeableness",
      "alphaOriginal": 0.82
    },
    {
      "id": "conscientiousness",
      "labelSv": "Samvetsgrannhet",
      "labelEn": "Conscientiousness",
      "alphaOriginal": 0.79
    },
    {
      "id": "emotional_stability",
      "labelSv": "Emotionell stabilitet",
      "labelEn": "Emotional Stability",
      "alphaOriginal": 0.86
    },
    {
      "id": "intellect_imagination",
      "labelSv": "Idéer och fantasi",
      "labelEn": "Intellect/Imagination",
      "alphaOriginal": 0.84
    }
  ],
  "items": [
    {
      "id": "ipip50-001",
      "order": 1,
      "factorId": "extraversion",
      "reverse": false,
      "en": "Am the life of the party.",
      "sv": "Jag brukar vara den som får igång stämningen på en fest."
    },
    {
      "id": "ipip50-002",
      "order": 2,
      "factorId": "agreeableness",
      "reverse": true,
      "en": "Feel little concern for others.",
      "sv": "Jag bryr mig inte särskilt mycket om hur andra har det."
    },
    {
      "id": "ipip50-003",
      "order": 3,
      "factorId": "conscientiousness",
      "reverse": false,
      "en": "Am always prepared.",
      "sv": "Jag brukar vara förberedd."
    },
    {
      "id": "ipip50-004",
      "order": 4,
      "factorId": "emotional_stability",
      "reverse": true,
      "en": "Get stressed out easily.",
      "sv": "Jag blir lätt stressad."
    },
    {
      "id": "ipip50-005",
      "order": 5,
      "factorId": "intellect_imagination",
      "reverse": false,
      "en": "Have a rich vocabulary.",
      "sv": "Jag kan många olika ord."
    },
    {
      "id": "ipip50-006",
      "order": 6,
      "factorId": "extraversion",
      "reverse": true,
      "en": "Don't talk a lot.",
      "sv": "Jag pratar inte så mycket."
    },
    {
      "id": "ipip50-007",
      "order": 7,
      "factorId": "agreeableness",
      "reverse": false,
      "en": "Am interested in people.",
      "sv": "Jag är intresserad av andra människor."
    },
    {
      "id": "ipip50-008",
      "order": 8,
      "factorId": "conscientiousness",
      "reverse": true,
      "en": "Leave my belongings around.",
      "sv": "Jag lämnar ofta mina saker framme."
    },
    {
      "id": "ipip50-009",
      "order": 9,
      "factorId": "emotional_stability",
      "reverse": false,
      "en": "Am relaxed most of the time.",
      "sv": "Jag känner mig oftast avslappnad."
    },
    {
      "id": "ipip50-010",
      "order": 10,
      "factorId": "intellect_imagination",
      "reverse": true,
      "en": "Have difficulty understanding abstract ideas.",
      "sv": "Jag har svårt att förstå idéer som inte handlar om något konkret."
    },
    {
      "id": "ipip50-011",
      "order": 11,
      "factorId": "extraversion",
      "reverse": false,
      "en": "Feel comfortable around people.",
      "sv": "Jag känner mig bekväm bland andra människor."
    },
    {
      "id": "ipip50-012",
      "order": 12,
      "factorId": "agreeableness",
      "reverse": true,
      "en": "Insult people.",
      "sv": "Jag säger saker som förolämpar andra."
    },
    {
      "id": "ipip50-013",
      "order": 13,
      "factorId": "conscientiousness",
      "reverse": false,
      "en": "Pay attention to details.",
      "sv": "Jag lägger märke till detaljer."
    },
    {
      "id": "ipip50-014",
      "order": 14,
      "factorId": "emotional_stability",
      "reverse": true,
      "en": "Worry about things.",
      "sv": "Jag oroar mig över saker."
    },
    {
      "id": "ipip50-015",
      "order": 15,
      "factorId": "intellect_imagination",
      "reverse": false,
      "en": "Have a vivid imagination.",
      "sv": "Jag har livlig fantasi."
    },
    {
      "id": "ipip50-016",
      "order": 16,
      "factorId": "extraversion",
      "reverse": true,
      "en": "Keep in the background.",
      "sv": "Jag brukar hålla mig i bakgrunden."
    },
    {
      "id": "ipip50-017",
      "order": 17,
      "factorId": "agreeableness",
      "reverse": false,
      "en": "Sympathize with others' feelings.",
      "sv": "Jag känner med andra när de har det svårt."
    },
    {
      "id": "ipip50-018",
      "order": 18,
      "factorId": "conscientiousness",
      "reverse": true,
      "en": "Make a mess of things.",
      "sv": "Jag ställer ofta till med oreda."
    },
    {
      "id": "ipip50-019",
      "order": 19,
      "factorId": "emotional_stability",
      "reverse": false,
      "en": "Seldom feel blue.",
      "sv": "Jag känner mig sällan nere."
    },
    {
      "id": "ipip50-020",
      "order": 20,
      "factorId": "intellect_imagination",
      "reverse": true,
      "en": "Am not interested in abstract ideas.",
      "sv": "Jag är inte särskilt intresserad av idéer som inte handlar om något konkret."
    },
    {
      "id": "ipip50-021",
      "order": 21,
      "factorId": "extraversion",
      "reverse": false,
      "en": "Start conversations.",
      "sv": "Jag brukar börja prata med andra."
    },
    {
      "id": "ipip50-022",
      "order": 22,
      "factorId": "agreeableness",
      "reverse": true,
      "en": "Am not interested in other people's problems.",
      "sv": "Jag är inte intresserad av andra människors problem."
    },
    {
      "id": "ipip50-023",
      "order": 23,
      "factorId": "conscientiousness",
      "reverse": false,
      "en": "Get chores done right away.",
      "sv": "Jag brukar göra mina vardagssysslor direkt."
    },
    {
      "id": "ipip50-024",
      "order": 24,
      "factorId": "emotional_stability",
      "reverse": true,
      "en": "Am easily disturbed.",
      "sv": "Jag blir lätt störd eller upprörd av saker."
    },
    {
      "id": "ipip50-025",
      "order": 25,
      "factorId": "intellect_imagination",
      "reverse": false,
      "en": "Have excellent ideas.",
      "sv": "Jag kommer på riktigt bra idéer."
    },
    {
      "id": "ipip50-026",
      "order": 26,
      "factorId": "extraversion",
      "reverse": true,
      "en": "Have little to say.",
      "sv": "Jag har inte så mycket att säga."
    },
    {
      "id": "ipip50-027",
      "order": 27,
      "factorId": "agreeableness",
      "reverse": false,
      "en": "Have a soft heart.",
      "sv": "Jag har lätt att bli berörd av hur andra har det."
    },
    {
      "id": "ipip50-028",
      "order": 28,
      "factorId": "conscientiousness",
      "reverse": true,
      "en": "Often forget to put things back in their proper place.",
      "sv": "Jag glömmer ofta att lägga tillbaka saker där de ska vara."
    },
    {
      "id": "ipip50-029",
      "order": 29,
      "factorId": "emotional_stability",
      "reverse": true,
      "en": "Get upset easily.",
      "sv": "Jag blir lätt upprörd."
    },
    {
      "id": "ipip50-030",
      "order": 30,
      "factorId": "intellect_imagination",
      "reverse": true,
      "en": "Do not have a good imagination.",
      "sv": "Jag har inte så bra fantasi."
    },
    {
      "id": "ipip50-031",
      "order": 31,
      "factorId": "extraversion",
      "reverse": false,
      "en": "Talk to a lot of different people at parties.",
      "sv": "Jag brukar prata med många olika personer på fester."
    },
    {
      "id": "ipip50-032",
      "order": 32,
      "factorId": "agreeableness",
      "reverse": true,
      "en": "Am not really interested in others.",
      "sv": "Jag är egentligen inte så intresserad av andra människor."
    },
    {
      "id": "ipip50-033",
      "order": 33,
      "factorId": "conscientiousness",
      "reverse": false,
      "en": "Like order.",
      "sv": "Jag gillar när det är ordning och reda."
    },
    {
      "id": "ipip50-034",
      "order": 34,
      "factorId": "emotional_stability",
      "reverse": true,
      "en": "Change my mood a lot.",
      "sv": "Mitt humör kan ändras mycket."
    },
    {
      "id": "ipip50-035",
      "order": 35,
      "factorId": "intellect_imagination",
      "reverse": false,
      "en": "Am quick to understand things.",
      "sv": "Jag förstår saker snabbt."
    },
    {
      "id": "ipip50-036",
      "order": 36,
      "factorId": "extraversion",
      "reverse": true,
      "en": "Don't like to draw attention to myself.",
      "sv": "Jag tycker inte om att dra uppmärksamhet till mig."
    },
    {
      "id": "ipip50-037",
      "order": 37,
      "factorId": "agreeableness",
      "reverse": false,
      "en": "Take time out for others.",
      "sv": "Jag tar mig tid för andra."
    },
    {
      "id": "ipip50-038",
      "order": 38,
      "factorId": "conscientiousness",
      "reverse": true,
      "en": "Shirk my duties.",
      "sv": "Jag försöker slippa sådant jag egentligen är skyldig att göra."
    },
    {
      "id": "ipip50-039",
      "order": 39,
      "factorId": "emotional_stability",
      "reverse": true,
      "en": "Have frequent mood swings.",
      "sv": "Mitt humör svänger ofta."
    },
    {
      "id": "ipip50-040",
      "order": 40,
      "factorId": "intellect_imagination",
      "reverse": false,
      "en": "Use difficult words.",
      "sv": "Jag använder ofta svåra ord."
    },
    {
      "id": "ipip50-041",
      "order": 41,
      "factorId": "extraversion",
      "reverse": false,
      "en": "Don't mind being the center of attention.",
      "sv": "Jag har inget emot att vara i centrum för uppmärksamheten."
    },
    {
      "id": "ipip50-042",
      "order": 42,
      "factorId": "agreeableness",
      "reverse": false,
      "en": "Feel others' emotions.",
      "sv": "Jag känner ofta av vad andra känner."
    },
    {
      "id": "ipip50-043",
      "order": 43,
      "factorId": "conscientiousness",
      "reverse": false,
      "en": "Follow a schedule.",
      "sv": "Jag brukar följa ett schema eller en tidsplan."
    },
    {
      "id": "ipip50-044",
      "order": 44,
      "factorId": "emotional_stability",
      "reverse": true,
      "en": "Get irritated easily.",
      "sv": "Jag blir lätt irriterad."
    },
    {
      "id": "ipip50-045",
      "order": 45,
      "factorId": "intellect_imagination",
      "reverse": false,
      "en": "Spend time reflecting on things.",
      "sv": "Jag lägger tid på att fundera över saker."
    },
    {
      "id": "ipip50-046",
      "order": 46,
      "factorId": "extraversion",
      "reverse": true,
      "en": "Am quiet around strangers.",
      "sv": "Jag är tystlåten bland människor jag inte känner."
    },
    {
      "id": "ipip50-047",
      "order": 47,
      "factorId": "agreeableness",
      "reverse": false,
      "en": "Make people feel at ease.",
      "sv": "Jag får andra att känna sig avslappnade."
    },
    {
      "id": "ipip50-048",
      "order": 48,
      "factorId": "conscientiousness",
      "reverse": false,
      "en": "Am exacting in my work.",
      "sv": "Jag är noggrann när jag gör en uppgift."
    },
    {
      "id": "ipip50-049",
      "order": 49,
      "factorId": "emotional_stability",
      "reverse": true,
      "en": "Often feel blue.",
      "sv": "Jag känner mig ofta nere."
    },
    {
      "id": "ipip50-050",
      "order": 50,
      "factorId": "intellect_imagination",
      "reverse": false,
      "en": "Am full of ideas.",
      "sv": "Jag har många idéer."
    }
  ],
  "adultDescriptiveReference": {
    "id": "escs-skidmore-2026-04",
    "kind": "descriptive_english_adult_reference_not_swedish_norms",
    "source": "https://darrenskidmore.com/projects/ipip-workbench/report/unified_report.html",
    "n": 570,
    "population": "ESCS community participants, adults, Oregon USA, English IPIP 50; not representative of Swedish teens or adults",
    "scoring": "sum of ten 1–5 keyed items, minimum 10, maximum 50",
    "allowedForSwedishNormInterpretation": false,
    "notes": "Derived from English-language instrument; modified Swedish language has not been psychometrically equated. Emotional stability = 60 − source Neuroticism sum (source M=24.99, SD=7.56). Descriptive reference only: SD deviations may be displayed explicitly as a limited comparison to US English-language adult respondents; never produce normed Swedish percentiles, clinical labels, or representative population claims.",
    "scales": {
      "extraversion": {
        "mean": 30.45,
        "sd": 7.61
      },
      "agreeableness": {
        "mean": 41.45,
        "sd": 5.25
      },
      "conscientiousness": {
        "mean": 39.21,
        "sd": 5.8
      },
      "emotional_stability": {
        "mean": 35.01,
        "sd": 7.56
      },
      "intellect_imagination": {
        "mean": 36.66,
        "sd": 6.65
      }
    }
  }
};
export default IPIP50_V1;
