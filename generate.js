// Fonction serveur (Vercel Serverless Function).
// Reçoit le titre, les photos (en base64) et/ou le texte du cours envoyés par le
// site, appelle l'API Anthropic avec la clé secrète (jamais exposée au
// navigateur), et renvoie le texte de la fiche de révision générée.
//
// Variable d'environnement requise sur Vercel : ANTHROPIC_API_KEY

module.exports = async (req, res) => {
  // Autorise les requêtes du même site (pas besoin de CORS si le front et
  // cette fonction sont déployés ensemble, mais on l'ajoute par sécurité).
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Méthode non autorisée." });
    return;
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Clé API manquante côté serveur (variable ANTHROPIC_API_KEY non définie)." });
      return;
    }

    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const { title, images, text } = body || {};

    const hasImages = Array.isArray(images) && images.length > 0;
    const hasText = typeof text === "string" && text.trim().length > 0;

    if (!hasImages && !hasText) {
      res.status(400).json({ error: "Aucune photo ni texte fourni." });
      return;
    }
    if (hasImages && images.length > 20) {
      res.status(400).json({ error: "Trop de photos envoyées en une seule fois (20 maximum)." });
      return;
    }

    const safeTitle = String(title || "Fiche de révision").slice(0, 200);

    let source = [];
    if (hasImages) source.push("des photos de pages d'un cours");
    if (hasText) source.push("des notes de cours saisies par l'élève");

    const instruction =
      "Tu es un professeur qui aide un(e) élève à réviser. Voici " + source.join(" ainsi que ") +
      ", sur le thème \"" + safeTitle + "\". " +
      "Rédige une fiche de révision claire et pédagogique en français, au format Markdown, en suivant EXACTEMENT cette structure :\n\n" +
      "# " + safeTitle + "\n" +
      "## Résumé\n(quelques phrases résumant le cours)\n\n" +
      "## Notions clés\n(liste à puces des idées et notions importantes)\n\n" +
      "## Définitions importantes\n(liste des termes et de leur définition, s'il y en a)\n\n" +
      "## Questions de révision\n(3 à 5 questions numérotées, chacune suivie immédiatement de sa réponse)\n\n" +
      "Ne mets aucun texte avant le titre, et ne commente pas ta réponse en dehors de cette structure.";

    const content = [{ type: "text", text: instruction }];

    if (hasImages) {
      for (const img of images) {
        if (!img || !img.data || !img.mediaType) continue;
        content.push({
          type: "image",
          source: { type: "base64", media_type: img.mediaType, data: img.data }
        });
      }
    }
    if (hasText) {
      content.push({ type: "text", text: "Notes de cours de l'élève :\n\n" + text.slice(0, 20000) });
    }

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 3000,
        messages: [{ role: "user", content }]
      })
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("Erreur API Anthropic:", apiRes.status, errText);
      res.status(502).json({ error: "Le service d'IA n'a pas pu traiter la demande." });
      return;
    }

    const data = await apiRes.json();
    const resultText = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    if (!resultText) {
      res.status(502).json({ error: "Réponse vide du modèle." });
      return;
    }

    res.status(200).json({ text: resultText });

  } catch (e) {
    console.error("Erreur serveur /api/generate:", e);
    res.status(500).json({ error: "Erreur serveur inattendue." });
  }
};
