import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/service_question_model.dart';

class ServiceQuestionService {
  final SupabaseClient _supabaseClient = Supabase.instance.client;

  // Get all questions for a specific service type
  Future<List<ServiceQuestionModel>> getQuestionsByServiceType(String serviceTypeId) async {
    try {
      final response = await _supabaseClient
          .from('service_questions')
          .select('*, sub_questions:service_questions(*)') // Include sub-questions
          .eq('service_type_id', serviceTypeId)
          .eq('is_active', true)
          .order('display_order');

      return (response as List)
          .map((data) => ServiceQuestionModel.fromJson(data))
          .toList();
    } catch (e) {
      print('Error fetching service questions: $e');
      rethrow;
    }
  }

  // Get questions for a service type by name
  Future<List<ServiceQuestionModel>> getQuestionsByServiceTypeName(String serviceTypeName) async {
    try {
      // First get the service type ID
      final serviceTypeResponse = await _supabaseClient
          .from('service_types')
          .select('id')
          .eq('name', serviceTypeName)
          .single();

      final String serviceTypeId = serviceTypeResponse['id'];

      // Then get the questions
      return await getQuestionsByServiceType(serviceTypeId);
    } catch (e) {
      print('Error fetching questions by service type name: $e');
      rethrow;
    }
  }

  // Save question answers for an order
  Future<void> saveQuestionAnswers(String orderId, List<ServiceQuestionModel> questions) async {
    try {
      // Convert questions to the format expected by the database
      final List<Map<String, dynamic>> questionAnswers = [];
      
      for (var question in questions) {
        if (question.answer != null) {
          questionAnswers.add({
            'order_id': orderId,
            'question_id': question.id,
            'question': question.question,
            'answer': question.answer.toString(),
            'question_type': question.questionType,
          });
        }
        
        // Process sub-questions if any
        if (question.subQuestions != null && question.subQuestions!.isNotEmpty) {
          for (var subQuestion in question.subQuestions!) {
            if (subQuestion.answer != null) {
              questionAnswers.add({
                'order_id': orderId,
                'question_id': subQuestion.id,
                'question': subQuestion.question,
                'answer': subQuestion.answer.toString(),
                'question_type': subQuestion.questionType,
                'parent_question_id': question.id,
              });
            }
          }
        }
        
        // Process added items if question type is add_items
        if (question.type == QuestionType.addItems && 
            question.addedItems != null && 
            question.addedItems!.isNotEmpty) {
          for (var item in question.addedItems!) {
            questionAnswers.add({
              'order_id': orderId,
              'question_id': question.id,
              'question': question.question,
              'answer': item['name'] ?? '',
              'question_type': 'add_items_entry',
              'additional_data': item,
            });
          }
        }
      }
      
      // Insert all question answers
      if (questionAnswers.isNotEmpty) {
        await _supabaseClient
            .from('order_question_answers')
            .insert(questionAnswers);
      }
    } catch (e) {
      print('Error saving question answers: $e');
      rethrow;
    }
  }
}