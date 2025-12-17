
export const generateTestImage = async (
  type: 'answerKey' | 'student', 
  questionCount: number = 5,
  studentName: string = "Test Öğrenci",
  studentNo: string = "12345"
): Promise<File> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Calculate dynamic height based on question count
  // Header takes ~300px, each row takes ~45px, plus footer buffer
  const minHeight = 1000;
  const calculatedHeight = 350 + (questionCount * 45);
  const height = Math.max(minHeight, calculatedHeight);
  const width = 800;

  canvas.width = width;
  canvas.height = height;

  if (!ctx) throw new Error("Canvas context could not be created");

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Draw Header Info
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.fillText("SINAV CEVAP FORMU", 250, 50);

  ctx.font = '20px Arial';
  if (type === 'student') {
      ctx.fillText(`Adı Soyadı: ${studentName}`, 50, 120);
      ctx.fillText(`Öğrenci No: ${studentNo}`, 50, 160);
      ctx.fillText(`Ders: Matematik Testi`, 50, 200);
  } else {
      ctx.fillText(`CEVAP ANAHTARI`, 50, 120);
      ctx.fillText(`Ders: Matematik Testi`, 50, 160);
  }

  // Draw Optical Area
  const startX = 50;
  const startY = 300;
  const rowHeight = 40;
  const colWidth = 40;
  const options = ['A', 'B', 'C', 'D', 'E'];

  ctx.font = '16px Arial';

  // Create a seed based on student name to ensure different students get different (but consistent) answers
  // Summing char codes ensures distinct names produce distinct patterns
  const nameSeed = studentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  for (let i = 0; i < questionCount; i++) {
    // Question Number
    ctx.fillStyle = '#000000';
    ctx.fillText(`${i + 1}.`, startX, startY + (i * rowHeight) + 25);

    // Determine which option to mark
    // Answer Key Pattern: A, B, C, D, E repeating (i % 5)
    // Student Pattern: Varied based on nameSeed + questionIndex
    let markIndex = -1;
    
    if (type === 'answerKey') {
        markIndex = i % 5;
    } else {
        // Pseudo-random logic for students
        // We want some correct answers and some wrong answers.
        const correctAnswer = i % 5;
        const randomness = (nameSeed + i * 17) % 100; // Generate a number 0-99

        if (randomness > 40) { 
            // 60% chance to mark the correct answer (simulating a decent student)
            markIndex = correctAnswer;
        } else {
            // 40% chance to mark a wrong answer (randomly shifted)
            markIndex = (correctAnswer + 1 + (randomness % 4)) % 5;
        }
    }

    // Draw Bubbles
    for (let j = 0; j < 5; j++) {
       const circleX = startX + 50 + (j * colWidth);
       const circleY = startY + (i * rowHeight) + 20;
       
       ctx.beginPath();
       ctx.arc(circleX, circleY, 12, 0, 2 * Math.PI);
       ctx.strokeStyle = '#000000';
       ctx.lineWidth = 2;
       ctx.stroke();

       // Fill if marked
       if (j === markIndex) {
           ctx.fillStyle = '#000000';
           ctx.fill();
       }

       // Text inside bubble (white if filled, black if empty)
       ctx.fillStyle = j === markIndex ? '#FFFFFF' : '#000000';
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       ctx.fillText(options[j], circleX, circleY);
       ctx.textAlign = 'start'; // Reset
       ctx.textBaseline = 'alphabetic'; // Reset
    }
  }

  // Add some noise/lines to simulate real paper
  ctx.strokeStyle = '#CCCCCC';
  ctx.beginPath();
  ctx.moveTo(0, 250);
  ctx.lineTo(width, 250);
  ctx.stroke();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${type === 'answerKey' ? 'cevap_anahtari' : 'ogrenci_kagidi'}_test.png`, { type: 'image/png' });
        resolve(file);
      } else {
        reject(new Error("Canvas blob creation failed"));
      }
    }, 'image/png');
  });
};
