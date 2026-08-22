import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    // Read the processed geopolitical events from the project's data layer
    // In production these would be fetched from Supabase storage or a DB table
    const events = [
      {
        id: "geo-evt-001",
        title: "Shipping disruptions reported near Strait of Hormuz",
        description: "Commercial vessels rerouting amid heightened regional naval activity.",
        url: "https://www.eia.gov/international/analysis/regions-topics/world-oil-transit-chokepoints",
        source: "eia.gov",
        sourceTier: 1,
        publishedAt: "2026-08-21T08:00:00Z",
        retrievedAt: "2026-08-21T08:00:00Z",
        region: "Strait of Hormuz",
        category: "GEOPOLITICAL",
        severity: "CRITICAL",
        impactScore: 95,
        confidence: 60,
        indiaExposure: "HIGH",
        relatedArticles: 1,
        dataType: "derived",
        modelVersion: "geopolitical-v1",
        aiAnalysis: null,
      },
      {
        id: "geo-evt-002",
        title: "Red Sea tanker attacks force Cape of Good Hope reroutings",
        description: "Multiple crude carriers diverting around Africa, adding 12-14 days transit time.",
        url: "https://www.eia.gov/international/analysis/regions-topics/world-oil-transit-chokepoints",
        source: "eia.gov",
        sourceTier: 1,
        publishedAt: "2026-08-21T07:00:00Z",
        retrievedAt: "2026-08-21T08:00:00Z",
        region: "Red Sea",
        category: "SHIPPING",
        severity: "HIGH",
        impactScore: 70,
        confidence: 60,
        indiaExposure: "MEDIUM",
        relatedArticles: 1,
        dataType: "derived",
        modelVersion: "geopolitical-v1",
        aiAnalysis: null,
      },
      {
        id: "geo-evt-003",
        title: "New sanctions package targets crude export networks",
        description: "Coordinated measures affecting shipping companies operating in sanctioned trade corridors.",
        url: "https://www.iea.org/reports/oil-market-report",
        source: "iea.org",
        sourceTier: 2,
        publishedAt: "2026-08-21T06:00:00Z",
        retrievedAt: "2026-08-21T08:00:00Z",
        region: "Russia-Europe",
        category: "SANCTIONS",
        severity: "HIGH",
        impactScore: 65,
        confidence: 50,
        indiaExposure: "MEDIUM",
        relatedArticles: 1,
        dataType: "derived",
        modelVersion: "geopolitical-v1",
        aiAnalysis: null,
      },
      {
        id: "geo-evt-004",
        title: "OPEC+ maintains current production quotas",
        description: "No immediate supply adjustment expected. Market remains balanced.",
        url: "https://www.opec.org/opec_web/en/publications/340.htm",
        source: "opec.org",
        sourceTier: 2,
        publishedAt: "2026-08-21T05:00:00Z",
        retrievedAt: "2026-08-21T08:00:00Z",
        region: "Global",
        category: "POLICY",
        severity: "LOW",
        impactScore: 15,
        confidence: 50,
        indiaExposure: null,
        relatedArticles: 1,
        dataType: "derived",
        modelVersion: "geopolitical-v1",
        aiAnalysis: null,
      },
    ];

    // GET /api/geopolitical/events — return all recent events
    // GET /api/geopolitical/critical — return only HIGH and CRITICAL events
    if (path === "critical") {
      const critical = events.filter((e) => e.severity === "HIGH" || e.severity === "CRITICAL");
      return new Response(JSON.stringify({
        events: critical,
        count: critical.length,
        lastUpdated: "2026-08-21T08:00:00Z",
        status: "mock",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: return all events
    return new Response(JSON.stringify({
      events,
      count: events.length,
      lastUpdated: "2026-08-21T08:00:00Z",
      status: "mock",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch geopolitical events" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
