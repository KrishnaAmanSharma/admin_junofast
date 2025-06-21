import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/service_type_model.dart';
import '../models/common_item_model.dart';

class ServiceTypeService {
  final SupabaseClient _supabaseClient = Supabase.instance.client;

  // Get all service types
  Future<List<ServiceTypeModel>> getAllServiceTypes() async {
    try {
      final response = await _supabaseClient
          .from('service_types')
          .select()
          .eq('is_active', true)
          .order('name');

      return (response as List)
          .map((data) => ServiceTypeModel.fromJson(data))
          .toList();
    } catch (e) {
      print('Error fetching service types: $e');
      rethrow;
    }
  }

  // Get a specific service type by ID
  Future<ServiceTypeModel> getServiceTypeById(String id) async {
    try {
      final response = await _supabaseClient
          .from('service_types')
          .select()
          .eq('id', id)
          .single();

      return ServiceTypeModel.fromJson(response);
    } catch (e) {
      print('Error fetching service type: $e');
      rethrow;
    }
  }

  // Get common items for a specific service type
  Future<List<CommonItemModel>> getCommonItemsByServiceType(String serviceTypeId) async {
    try {
      final response = await _supabaseClient
          .from('common_items')
          .select()
          .eq('service_type_id', serviceTypeId)
          .eq('is_active', true)
          .order('name');

      return (response as List)
          .map((data) => CommonItemModel.fromJson(data))
          .toList();
    } catch (e) {
      print('Error fetching common items: $e');
      rethrow;
    }
  }

  // Get common items for a service type by name
  Future<List<CommonItemModel>> getCommonItemsByServiceTypeName(String serviceTypeName) async {
    try {
      // First get the service type ID
      final serviceTypeResponse = await _supabaseClient
          .from('service_types')
          .select('id')
          .eq('name', serviceTypeName)
          .single();

      final String serviceTypeId = serviceTypeResponse['id'];

      // Then get the common items
      return await getCommonItemsByServiceType(serviceTypeId);
    } catch (e) {
      print('Error fetching common items by service type name: $e');
      rethrow;
    }
  }

  // Map icon data to common items based on name
  List<CommonItemModel> mapIconsToCommonItems(List<CommonItemModel> items) {
    // This is a utility method to map icons to common items based on their names
    // You can customize this based on your needs or fetch icon mappings from the database
    final Map<String, IconData> iconMappings = {
      'Rooms': Icons.bedroom_parent_outlined,
      'Sofa': Icons.chair_outlined,
      'Bed': Icons.bed_outlined,
      'Almirah': Icons.door_sliding_outlined,
      'Wardrobe': Icons.door_sliding_outlined,
      'TV': Icons.tv_outlined,
      'Washing Machine': Icons.local_laundry_service_outlined,
      'Refrigerator': Icons.kitchen_outlined,
      'AC': Icons.ac_unit_outlined,
      'Table': Icons.table_bar_outlined,
      'Chair': Icons.event_seat_outlined,
      // Add more mappings as needed
    };

    return items.map((item) {
      // Try to find an exact match first
      IconData? icon = iconMappings[item.name];
      
      // If no exact match, try to find a partial match
      if (icon == null) {
        for (var entry in iconMappings.entries) {
          if (item.name.toLowerCase().contains(entry.key.toLowerCase())) {
            icon = entry.value;
            break;
          }
        }
      }
      
      return item.copyWith(icon: icon);
    }).toList();
  }
}