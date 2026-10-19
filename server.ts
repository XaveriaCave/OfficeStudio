import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

// Agent Chat API endpoint
app.post('/api/agent-chat', async (req, res) => {
  try {
    const {
      agent,
      message,
      chatHistory = [],
      customApiKey,
      officeContext,
      accountingContext,
    } = req.body;

    if (!agent || !message) {
      return res.status(400).json({ error: 'Missing agent or message parameter' });
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Provide an intelligent simulated persona reply while reminding user to enter their Gemini key
      const roleDesc = agent.role || 'Team Member';
      const fallbackReply = `[${agent.name} • ${roleDesc}]: "I hear you! I'm currently working on ${
        agent.activityDescription || 'office tasks'
      } in ${officeContext?.name || 'the studio'}. To enable full real-time reasoning with me, please enter your Gemini API key in my agent settings card above (stored securely in your browser localStorage)!"`;

      return res.json({
        reply: fallbackReply,
        needsApiKey: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Build specialized prompt context
    let systemInstruction = `You are ${agent.name}, an AI agent working as "${agent.role}" at Office Studio @V Offices.
Hierarchy Level: ${agent.hierarchy} (Level ${agent.hierarchyLevel}).
Department: ${agent.department}.
Current Status: ${agent.state} ("${agent.activityDescription}").
Current Office Suite: ${officeContext?.name || 'Main Office'} (${officeContext?.code || 'HQ'}).
`;

    if (agent.systemPrompt) {
      systemInstruction += `\nYour Persona & Core Directives: ${agent.systemPrompt}\n`;
    }

    if (agent.isAccountingAgent && accountingContext) {
      systemInstruction += `\nCRITICAL ROLE - CORPORATE ACCOUNTING & FINANCE CONTROLLER:
You manage the accounting status for this office and the company.
Current Balance Sheet & Accounting Ledger context:
- Currency: ${accountingContext.currency || '$'}
- Monthly Gross Revenue: ${accountingContext.currency}${accountingContext.monthlyRevenue?.toLocaleString()}
- Cash Reserves in Bank: ${accountingContext.currency}${accountingContext.cashReserves?.toLocaleString()}
- Office Lease Rate: ${accountingContext.currency}${accountingContext.monthlyLeaseRatePerM2}/m² (Estimated Suite Lease: ${accountingContext.currency}${accountingContext.suiteLeaseCost?.toLocaleString()}/mo)
- Monthly Staff Payroll: ${accountingContext.currency}${accountingContext.payrollCost?.toLocaleString()}/mo (${accountingContext.agentCount} team members @ avg ${accountingContext.currency}${accountingContext.averageSalaryPerAgent}/mo)
- Total Monthly Burn Rate: ${accountingContext.currency}${accountingContext.monthlyBurn?.toLocaleString()}/mo
- Net Cash Flow Margin: ${accountingContext.currency}${accountingContext.netMargin?.toLocaleString()}/mo
- Net Cash Runway: ${accountingContext.runwayMonths} months
- Recent Invoices & Vouchers:
${JSON.stringify(accountingContext.invoices || [], null, 2)}

Provide clear, professional, concise, and mathematically accurate financial analyses, GAAP audits, cost-cutting recommendations, or budget status updates based on these numbers.`;
    } else {
      systemInstruction += `\nKeep responses professional, authentic to your job title and hierarchy level, collaborative, and concise (1-3 paragraphs or bullet points).`;
    }

    // Format contents with previous history
    const contents: any[] = [];
    if (Array.isArray(chatHistory)) {
      for (const item of chatHistory.slice(-8)) {
        contents.push({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    const replyText = response.text || '(No reply generated)';
    return res.json({ reply: replyText });
  } catch (err: any) {
    console.error('Agent chat endpoint error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate agent response',
      details: String(err),
    });
  }
});

// Financial Audit automated report endpoint
app.post('/api/accounting-audit', async (req, res) => {
  try {
    const { accounting, agent, officeName, customApiKey } = req.body;
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        report: `Financial Audit Summary for ${officeName || 'Office'}:\n- Monthly Revenue: $${accounting?.monthlyRevenue?.toLocaleString()}\n- Cash Reserves: $${accounting?.cashReserves?.toLocaleString()}\n- Status: Healthy 24+ Month Runway. Please configure a Gemini API key in agent settings for an in-depth AI audit report.`,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Perform an executive GAAP financial audit and runway health evaluation for "${officeName}" using this data: ${JSON.stringify(
        accounting
      )}. Highlight revenue, burn rate, lease economics, and recommend 3 tactical capital allocations.`,
      config: {
        systemInstruction: `You are ${agent?.name || 'Elena Vance'}, Principal Accounting Controller. Produce a polished, executive-ready financial audit with clear sections, KPIs, and actionable takeaways.`,
      },
    });

    return res.json({ report: response.text });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pacific Mind Spatial server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
