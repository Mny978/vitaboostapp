import { jsPDF } from 'jspdf';
import { UserProfile, DietPlan } from '../types';

export function exportDietPlanToPdf(plan: DietPlan, profile: UserProfile) {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const maxPageY = 280;
  let currentY = 18;

  const checkPageBreak = (neededSpace: number) => {
    if (currentY + neededSpace > maxPageY) {
      doc.addPage();
      currentY = 20;
      drawFooter();
    }
  };

  const drawFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(130, 140, 150);
      doc.text(
        `VitaBoost NutriApp | Clinical Dietetics & Nutrition | Page ${i} of ${pageCount}`,
        margin,
        290
      );
      doc.text('Estimates only. Consult a healthcare professional.', pageWidth - margin, 290, {
        align: 'right',
      });
    }
  };

  // Header Banner
  doc.setFillColor(37, 99, 235); // Royal Blue
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('VitaBoost NutriApp', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(220, 235, 255);
  doc.text('Personalized Clinical Nutrition & Dietary Intervention Plan', margin, 22);

  currentY = 36;

  // Patient / Client Summary Box
  doc.setFillColor(245, 248, 255);
  doc.setDrawColor(210, 225, 250);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text(`Client: ${profile.name || 'Valued User'}`, margin + 4, currentY + 7);
  doc.text(`Age/Gender: ${profile.age || '--'} yrs / ${profile.gender}`, margin + 65, currentY + 7);
  doc.text(`Goal: ${profile.goal}`, margin + 125, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(`Target: ${profile.assessment.target || '--'} kcal/day`, margin + 4, currentY + 14);
  doc.text(`Diet Type: ${profile.dietaryPreference}`, margin + 65, currentY + 14);
  doc.text(
    `BMI: ${profile.assessment.bmi || '--'} (${profile.assessment.bmiStatus})`,
    margin + 125,
    currentY + 14
  );

  doc.text(`Medical Notes: ${profile.medicalConditions || 'None'}`, margin + 4, currentY + 21);
  doc.text(`Allergies: ${profile.allergies || 'None'}`, margin + 125, currentY + 21);

  currentY += 33;

  // Dietitian Strategy Summary
  if (plan.dietitianGeneralGuidance) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(22, 163, 74); // Emerald Green
    doc.text('Clinical Dietary Strategy & Focus', margin, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    const splitGuidance = doc.splitTextToSize(plan.dietitianGeneralGuidance, contentWidth);
    doc.text(splitGuidance, margin, currentY);
    currentY += splitGuidance.length * 4.5 + 4;
  }

  // Iterate over 3 Days
  plan.days.forEach((day) => {
    checkPageBreak(35);

    // Day Header
    doc.setFillColor(22, 163, 74); // Green accent
    doc.rect(margin, currentY, 3, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39);
    doc.text(`${day.dayTitle}  (~${day.totalCalories} kcal)`, margin + 6, currentY + 7);
    currentY += 12;

    if (day.focusTheme) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Focus: ${day.focusTheme}`, margin + 6, currentY);
      currentY += 6;
    }

    // Meals in Day
    day.meals.forEach((meal) => {
      checkPageBreak(24);

      doc.setFillColor(250, 250, 252);
      doc.setDrawColor(230, 235, 245);
      doc.roundedRect(margin, currentY, contentWidth, 18, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(37, 99, 235);
      doc.text(`${meal.slot}: ${meal.dishName}`, margin + 3, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      doc.text(
        `Portion: ${meal.portion}  |  ~${meal.kcal} kcal (P: ${meal.macros.protein}g, C: ${meal.macros.carbs}g, F: ${meal.macros.fat}g)`,
        margin + 3,
        currentY + 11
      );

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      const noteSplit = doc.splitTextToSize(`Note: ${meal.healthNote}`, contentWidth - 6);
      doc.text(noteSplit, margin + 3, currentY + 15.5);

      currentY += 21;
    });

    if (day.tipsForDay && day.tipsForDay.length > 0) {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 58, 138);
      doc.text('Daily Lifestyle Tips:', margin, currentY);
      currentY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      day.tipsForDay.forEach((t) => {
        doc.text(`• ${t}`, margin + 3, currentY);
        currentY += 4;
      });
      currentY += 2;
    }

    currentY += 4;
  });

  // Footer for all pages
  drawFooter();

  // Save PDF
  const safeName = (profile.name || 'User').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`VitaBoost_DietPlan_${safeName}.pdf`);
}
