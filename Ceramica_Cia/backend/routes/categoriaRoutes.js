const express = require('express');
const router = express.Router();
const { query } = require('../database');

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT id_categoria, nome_categoria, descricao_categoria FROM public.categorias ORDER BY nome_categoria');
    res.set('Cache-Control', 'no-store');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Não foi possível listar as categorias.' });
  }
});

module.exports = router;
