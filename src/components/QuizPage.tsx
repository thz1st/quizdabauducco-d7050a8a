import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BauduccoLogo } from './Decorations';

interface QuizPageProps {
  onComplete: () => void;
}

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

const questions: Question[] = [
  {
    question: "Qual é o produto mais famoso da Bauducco no Natal?",
    options: ["Pizza", "Panetone", "Sorvete", "Hambúrguer"],
    correctIndex: 1,
  },
  {
    question: "O Chocottone é um panetone com:",
    options: ["Frutas", "Chocolate", "Queijo", "Carne"],
    correctIndex: 1,
  },
  {
    question: "Em qual época do ano mais se consome Panetone?",
    options: ["Carnaval", "Páscoa", "Natal", "São João"],
    correctIndex: 2,
  },
  {
    question: "Qual a cor predominante da embalagem Bauducco?",
    options: ["Azul", "Verde", "Amarelo", "Preto"],
    correctIndex: 2,
  },
];

const QuizPage = ({ onComplete }: QuizPageProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  const handleAnswer = (index: number) => {
    if (isTransitioning) return;
    
    setSelectedAnswer(index);
    setIsTransitioning(true);

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setIsTransitioning(false);
      } else {
        onComplete();
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-6">
      {/* Header with Logo */}
      <div className="mb-6">
        <BauduccoLogo />
      </div>

      {/* Progress Section */}
      <motion.div
        className="w-full max-w-md mx-auto mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-muted-foreground">
            Pergunta <span className="text-gold font-semibold">{currentQuestion + 1}</span> de {questions.length}
          </span>
          <span className="text-gold font-semibold">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </motion.div>

      {/* Question Section */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {/* Question Text */}
            <motion.h2
              className="font-display text-2xl md:text-3xl text-center text-foreground mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {question.question}
            </motion.h2>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Button
                    variant={selectedAnswer === index ? "quiz-selected" : "quiz"}
                    size="quiz"
                    onClick={() => handleAnswer(index)}
                    disabled={isTransitioning}
                    className="w-full transition-all duration-300"
                  >
                    <span className="w-8 h-8 bg-gold/20 text-gold rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1 text-left">{option}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizPage;
