const express = require("express");
const router = express.Router();

const ReviewModel = require("../models/Review.model");
const EstablishmentModel = require("../models/Establishment.model");
const UserModel = require("../models/User.model");

const isAuthenticated = require("../middlewares/isAuthenticated");
const attachCurrentUser = require("../middlewares/attachCurrentUser");

// Cria comentário apenas se o user não é o admin do estabelecimento
router.post("/create", isAuthenticated, attachCurrentUser, async (req, res) => {
  try {
    const user = await UserModel.findOne({ _id: req.currentUser._id });
    const { comment, establishmentId, rate } = req.body;

    // Saber se o user é o dono do estabelecimento
    if (user.userEstablishment === req.body.establishmentId) {
      return res.status(403).json({
        message:
          "Acesso negado: você não pode fazer comentário no seu próprio estabelecimento",
      });
    }

    const reviewCreated = await ReviewModel.create({
      comment: comment,
      establishmentId: establishmentId,
      userId: user._id,
      username: user.name,
      rate: rate
    });

    await EstablishmentModel.findOneAndUpdate(
      { _id: reviewCreated.establishmentId },
      { $push: { reviews: reviewCreated._id } }
    );

    res.status(201).json(reviewCreated);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// Atualizar comentário (só se for o dono do comentário)
router.patch("/edit/:id", isAuthenticated, attachCurrentUser, async (req, res) => {
  try {
    const review = await ReviewModel.findOne({ _id: req.params.id });

    // Verificar se o user é o dono do review
    if (review.userId != req.user._id) {
      return res.status(403).json({
        message:
          "Acesso negado: você não tem autorização para atualizar esse comentário",
      });
    }

    const reviewUpdated = await ReviewModel.findOneAndUpdate(
      { _id: req.params.id },
      { $set:  req.body  },
      { new: true, runValidators: true }
    );

    res.status(200).json(reviewUpdated);
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Comentário não encontrado" });
  }
});

// Excluir comentário (Só se o user for dono do comentário)
router.delete("/delete/:id", isAuthenticated, attachCurrentUser, async (req, res) => {
  try {
    
    const review = await ReviewModel.findOne({ _id: req.params.id });
    const user = await UserModel.findOne({ _id: req.currentUser._id });

    // Verificar se o user é o dono do comentário
    console.log(review.userId)
    console.log(user._id)

    if (review.userId !== currentUser._id) {
        return res.status(403).json({
            message:
              "Acesso negado: você não tem autorização para excluir esse comentário",
          });
    }
      
      await EstablishmentModel.findOneAndUpdate(
        { _id: review.establishmentId },
        { $pull: { reviews: req.params.id } }
      );

      const deletedReview = await ReviewModel.deleteOne({ _id: req.params.id });
      res.status(200).json({});

      if (deletedReview.deletedCount < 1) {
        return res.status(404).json({ message: "Comment not found" });
      }


  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Comment not found" });
  }
});

module.exports = router;